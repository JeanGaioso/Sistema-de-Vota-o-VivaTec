import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { startupsService, evaluationsService, auditLogsService } from '@/services/api'
import { Startup, Evaluation, EVALUATION_CRITERIA, EvaluationCriteria } from '@/types'
import { getFileUrl } from '@/lib/ranking'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { LoginModal } from '@/components/LoginModal'
import {
  ClipboardCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Leaf,
  Users,
  Building,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  LogIn,
  FileText,
  ExternalLink,
  BookOpen,
  Info,
} from 'lucide-react'

export default function EvaluatorPage() {
  const { user, isAuthenticated, isEvaluator, isAdmin, loginWithTokenOrQuickAccess } = useAuth()
  const { toast } = useToast()

  const [startups, setStartups] = useState<Startup[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)

  // Form State
  const [formScores, setFormScores] = useState<EvaluationCriteria>({
    score_esg: 15,
    score_criatividade: 15,
    score_engajamento: 12,
    score_figurino: 12,
    score_narrativa: 12,
    score_briefing: 8,
    score_gestao_tempo: 4,
  })
  const [feedback, setFeedback] = useState('')
  const [currentEvalId, setCurrentEvalId] = useState<string | null>(null)
  const [isFinalized, setIsFinalized] = useState(false)

  const fetchEvaluations = async () => {
    if (!user) return
    try {
      const [allStartups, myEvals] = await Promise.all([
        startupsService.getAll(),
        evaluationsService.getByEvaluator(user.id),
      ])
      setStartups(allStartups)
      setEvaluations(myEvals)
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-login via parâmetro ?token=... na URL (usado pelo QR Code da banca)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    if (tokenParam) {
      // Se já autenticado, verificar se o token atual coincide com o do usuário autenticado
      if (isAuthenticated && user) {
        const userToken = (user.quick_token || user.email.split('@')[0] || '').toLowerCase()
        const requestedToken = tokenParam.trim().toLowerCase()
        if (userToken && requestedToken && userToken !== requestedToken) {
          // Usuário diferente tentando acessar via outro QR Code -> efetuar novo login com o token indicado
          const switchUser = async () => {
            try {
              const success = await loginWithTokenOrQuickAccess(tokenParam)
              if (success) {
                toast({
                  title: 'Acesso Rápido da Banca!',
                  description: 'Sessão alterada para o jurado deste QR Code.',
                })
              }
            } catch (e) {
              console.warn('Falha na troca de sessão via QR Code:', e)
            }
          }
          switchUser()
        }
        return
      }

      if (!isAuthenticated) {
        const doAutoLogin = async () => {
          try {
            const success = await loginWithTokenOrQuickAccess(tokenParam)
            if (success) {
              toast({
                title: 'Acesso Rápido da Banca!',
                description: 'Login realizado com sucesso via QR Code.',
              })
            } else {
              toast({
                title: 'QR Code Não Reconhecido',
                description: 'Não foi possível autenticar o jurado com este código.',
                variant: 'destructive',
              })
            }
          } catch (e) {
            console.warn('Falha no auto-login:', e)
          }
        }
        doAutoLogin()
      }
    }
  }, [isAuthenticated, user?.id, user?.quick_token])

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvaluations()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  // Carregar avaliação da startup selecionada
  const handleSelectStartup = (startup: Startup) => {
    setSelectedStartup(startup)
    setReviewMode(false)

    const existing = evaluations.find((e) => e.startup === startup.id)
    if (existing) {
      setCurrentEvalId(existing.id)
      setFormScores({
        score_esg: existing.score_esg ?? 15,
        score_criatividade: existing.score_criatividade ?? 15,
        score_engajamento: existing.score_engajamento ?? 12,
        score_figurino: existing.score_figurino ?? 12,
        score_narrativa: existing.score_narrativa ?? 12,
        score_briefing: existing.score_briefing ?? 8,
        score_gestao_tempo: existing.score_gestao_tempo ?? 4,
      })
      setFeedback(existing.feedback || '')
      setIsFinalized(!!existing.is_finalized)
    } else {
      setCurrentEvalId(null)
      setFormScores({
        score_esg: 15,
        score_criatividade: 15,
        score_engajamento: 12,
        score_figurino: 12,
        score_narrativa: 12,
        score_briefing: 8,
        score_gestao_tempo: 4,
      })
      setFeedback('')
      setIsFinalized(false)
    }
  }

  const handleScoreChange = (key: keyof EvaluationCriteria, val: number, max: number) => {
    if (isFinalized) return
    const clamped = Math.max(0, Math.min(val, max))
    setFormScores((prev) => ({
      ...prev,
      [key]: clamped,
    }))
  }

  const calculateTotal = () => {
    return (
      (formScores.score_esg || 0) +
      (formScores.score_criatividade || 0) +
      (formScores.score_engajamento || 0) +
      (formScores.score_figurino || 0) +
      (formScores.score_narrativa || 0) +
      (formScores.score_briefing || 0) +
      (formScores.score_gestao_tempo || 0)
    )
  }

  // Envio final com trava de edição (PRD Regra de Negócio 3)
  const handleSubmitEvaluation = async () => {
    if (!user || !selectedStartup) return
    if (isFinalized) {
      toast({
        title: 'Avaliação Bloqueada',
        description: 'Esta avaliação já foi finalizada e travada.',
        variant: 'destructive',
      })
      return
    }

    // Validação automática: impedir envio se algum critério exceder ou for inválido
    for (const c of EVALUATION_CRITERIA) {
      const val = formScores[c.key]
      if (val === undefined || val === null || val < 0 || val > c.max) {
        toast({
          title: 'Nota Inválida',
          description: `O critério ${c.label} deve ter nota entre 0 e ${c.max}.`,
          variant: 'destructive',
        })
        return
      }
    }

    if (!feedback.trim()) {
      toast({
        title: 'Feedback Obrigatório',
        description: 'Por favor, insira uma breve observação ou parecer para a startup.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload: Partial<Evaluation> = {
        id: currentEvalId || undefined,
        startup: selectedStartup.id,
        evaluator: user.id,
        score_esg: formScores.score_esg,
        score_criatividade: formScores.score_criatividade,
        score_engajamento: formScores.score_engajamento,
        score_figurino: formScores.score_figurino,
        score_narrativa: formScores.score_narrativa,
        score_briefing: formScores.score_briefing,
        score_gestao_tempo: formScores.score_gestao_tempo,
        feedback: feedback.trim(),
        is_finalized: true, // Trava de edição ativada
      }

      const saved = await evaluationsService.saveEvaluation(payload)
      setCurrentEvalId(saved.id)
      setIsFinalized(true)

      // Auditoria
      await auditLogsService.log(
        'AVALIAÇÃO_FINALIZADA',
        `Nota total atribuída: ${calculateTotal()}/100. Feedback: "${feedback.trim().substring(0, 50)}..."`,
        selectedStartup.name,
      )

      toast({
        title: 'Avaliação Enviada com Sucesso!',
        description: `Nota de ${calculateTotal()}/100 registrada e bloqueada com segurança.`,
      })

      await fetchEvaluations()
      setReviewMode(false)
    } catch (err) {
      console.error('Erro ao submeter avaliação:', err)
      toast({
        title: 'Erro ao Enviar',
        description: 'Não foi possível salvar sua avaliação. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getPillarBadge = (pillar: string) => {
    switch (pillar) {
      case 'Ambiental':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Leaf className="w-3 h-3 text-emerald-600" /> Ambiental
          </span>
        )
      case 'Social':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300">
            <Users className="w-3 h-3 text-blue-600" /> Social
          </span>
        )
      case 'Governança':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
            <Building className="w-3 h-3 text-amber-600" /> Governança
          </span>
        )
      default:
        return null
    }
  }

  // Se não autenticado
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh]">
        <div className="w-16 h-16 rounded-3xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-4 shadow-xl">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Banca Examinadora Viva Tec</h2>
        <p className="text-sm text-slate-600 mb-6">
          Para atribuir notas às apresentações do Festival Viva Tec, faça login rápido via
          Código/Token ou e-mail.
        </p>
        <Button
          onClick={() => setLoginModalOpen(true)}
          className="bg-[#E11D74] hover:bg-[#BE185D] text-white font-black h-12 px-6 rounded-xl shadow-lg flex items-center gap-2"
        >
          <LogIn className="w-5 h-5 text-white" />
          <span>Acessar como Avaliador</span>
        </Button>
        <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      </div>
    )
  }

  // Se autenticado mas NÃO possui a condição de avaliador ativa
  if (!isEvaluator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh]">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Acesso Restrito à Banca</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Olá, <strong>{user?.name}</strong>. Sua conta de membro da Comissão Organizadora está
          ativa, mas a <strong>condição de avaliador</strong> está desativada no momento.
          <br />
          Para avaliar startups ou participar da banca examinadora, solicite a ativação da sua
          condição de avaliador no painel administrativo.
        </p>
        {isAdmin && (
          <a
            href="/admin"
            className="inline-flex items-center gap-2 bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold h-11 px-6 rounded-xl shadow-md text-sm transition-all"
          >
            <span>Ir para o Painel da Comissão</span>
          </a>
        )}
      </div>
    )
  }
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header do Módulo do Avaliador Viva Tec */}
      <div className="bg-[#1A1A1A] text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-[#E11D74] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E11D74] text-white">
              Banca Oficial Viva Tec
            </span>
            <span className="text-xs text-pink-200">Próxima parada: Ensino Médio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{user?.name}</h1>
          <p className="text-xs text-pink-200">
            {evaluations.filter((e) => e.is_finalized).length} de {startups.length} startups
            avaliadas
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
          <div className="text-right">
            <span className="text-[10px] text-pink-200 block uppercase font-bold">Progresso</span>
            <span className="text-lg font-black text-[#E11D74]">
              {Math.round(
                (evaluations.filter((e) => e.is_finalized).length / (startups.length || 1)) * 100,
              )}
              %
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEvaluations}
            className="text-white hover:bg-white/10 rounded-xl"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* SELETOR DE STARTUPS (Cards mobile-first com status de avaliação) */}
      {!selectedStartup ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#1A1A1A] uppercase tracking-wider">
              Startups Agendadas para Apresentação
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Selecione uma equipe para avaliar (&lt;60s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {startups.map((s) => {
              const evalRecord = evaluations.find((e) => e.startup === s.id)
              const finalized = !!evalRecord?.is_finalized

              return (
                <Card
                  key={s.id}
                  onClick={() => handleSelectStartup(s)}
                  className={`cursor-pointer p-5 rounded-3xl border-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm relative overflow-hidden ${
                    finalized
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-[#E11D74]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E11D74] flex items-center justify-center font-bold text-xs">
                        {s.order || '#'}
                      </span>
                      {getPillarBadge(s.esg_pillar)}
                    </div>

                    {finalized ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Avaliado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E11D74] bg-pink-100 px-2.5 py-1 rounded-full border border-pink-200 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-[#E11D74]" /> Pendente
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    Herói Fictício
                  </span>
                  <h3 className="text-lg font-black text-[#1A1A1A] truncate">{s.hero_name}</h3>
                  <p className="text-xs font-bold text-[#E11D74] mb-1">{s.name}</p>

                  {s.estudantes && (
                    <p className="text-[11px] text-slate-600 line-clamp-1 mb-2 font-medium">
                      👥 {s.estudantes}
                    </p>
                  )}

                  {/* Indicação do Briefing no Card do Avaliador */}
                  <div className="mb-2">
                    {s.briefing_file ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E11D74] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                        <FileText className="w-3 h-3" /> Briefing Disponível (PDF)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        <Info className="w-3 h-3 text-slate-300" /> Sem Briefing
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 italic mb-3">
                    "{s.synopsis || 'Sem sinopse cadastrada.'}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-[#E11D74]">
                      {finalized ? 'Visualizar notas submetidas' : 'Iniciar avaliação (<60s)'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#E11D74]" />
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        /* FORMULÁRIO DE AVALIAÇÃO DOS 7 CRITÉRIOS (Mobile First / Touch Friendly) */
        <section className="space-y-6">
          {/* Top Bar da Startup Selecionada */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStartup(null)}
              className="rounded-xl font-bold text-xs h-9"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar à Lista
            </Button>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Avaliando
              </span>
              <h2 className="text-base font-black text-[#1A1A1A]">{selectedStartup.hero_name}</h2>
              <span className="text-xs text-[#E11D74] font-bold">{selectedStartup.name}</span>
            </div>{' '}
          </div>

          {/* PAINEL DE CONSULTA DA BANCA: JORNADA DO HERÓI COMPLETA & BRIEFING OFICIAL */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-pink-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-pink-100 text-[#E11D74] flex items-center justify-center font-black">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A]">
                    Material de Consulta da Banca
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Jornada do Herói completa e documento de Briefing para subsidiar a nota
                  </p>
                </div>
              </div>

              {/* Botão/Link Ver Briefing ou Estado Vazio */}
              <div>
                {selectedStartup.briefing_file ? (
                  <a
                    href={
                      getFileUrl('startups', selectedStartup.id, selectedStartup.briefing_file) ||
                      '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D74] hover:bg-[#BE185D] text-white text-xs font-black shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Briefing (PDF)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Briefing ainda não enviado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informações da Equipe / Estudantes */}
            <div className="flex flex-wrap items-center gap-3">
              {getPillarBadge(selectedStartup.esg_pillar)}
              {selectedStartup.estudantes && (
                <span className="text-xs text-slate-600 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 font-medium">
                  👥 <strong>Estudantes:</strong> {selectedStartup.estudantes}
                </span>
              )}
            </div>

            {/* Sinopse Completa da Jornada do Herói */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D74] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Sinopse Completa da Jornada do Herói
              </span>
              <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                {selectedStartup.synopsis?.trim()
                  ? selectedStartup.synopsis
                  : 'Nenhuma sinopse da jornada cadastrada para esta startup.'}
              </div>
            </div>
          </div>

          {/* Banner de Trava de Edição se já Finalizado */}
          {isFinalized && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900">
              <Lock className="w-6 h-6 text-amber-700 flex-shrink-0" />
              <div className="text-xs">
                <strong className="block font-bold">Avaliação Bloqueada para Edição</strong>
                Suas notas foram submetidas e consolidadas no servidor. Apenas a comissão
                organizadora pode solicitar liberação para reavaliação.
              </div>
            </div>
          )}

          {/* MODO REVISÃO ANTES DO ENVIO */}
          {reviewMode ? (
            <div className="bg-white rounded-3xl p-6 border-2 border-pink-200 shadow-xl space-y-6">
              <div className="text-center space-y-1">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#E11D74] text-white uppercase tracking-wider">
                  Etapa de Revisão Final
                </span>
                <h3 className="text-2xl font-black text-[#1A1A1A]">
                  Confirmar Pontuação: {calculateTotal()} / 100
                </h3>
                <p className="text-xs text-slate-500">
                  Verifique suas notas antes de enviar. O envio travará o formulário.
                </p>
              </div>

              <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                {EVALUATION_CRITERIA.map((crit) => (
                  <div key={crit.key} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="font-bold text-[#1A1A1A]">{crit.label}</strong>
                      <span className="text-slate-400 block text-[10px]">{crit.description}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-[#E11D74]">
                        {formScores[crit.key]}
                      </span>
                      <span className="text-[10px] text-slate-400"> / {crit.max}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl">
                <span className="text-[11px] font-bold text-[#E11D74] uppercase tracking-wider block mb-1">
                  Parecer & Feedback Registrado:
                </span>
                <p className="text-xs text-slate-700 italic">"{feedback}"</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReviewMode(false)}
                  className="flex-1 h-12 font-bold rounded-2xl text-xs"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Ajustar Notas
                </Button>
                <Button
                  onClick={handleSubmitEvaluation}
                  disabled={submitting}
                  className="h-12 px-8 bg-[#E11D74] hover:bg-[#BE185D] text-white font-black text-sm rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Gravando...' : 'Finalizar e Enviar Nota Oficial'}</span>
                </Button>{' '}
              </div>
            </div>
          ) : (
            /* FORMULÁRIO COM OS 7 CRITÉRIOS */
            <div className="space-y-4">
              {/* Box da Nota Total em Tempo Real Viva Tec */}
              <div className="sticky top-20 z-20 bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border-2 border-[#E11D74]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E11D74] block">
                    Total Acumulado
                  </span>
                  <span className="text-xs text-pink-200 font-medium">Soma dos 7 critérios</span>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#E11D74]">
                    {calculateTotal()}
                  </span>
                  <span className="text-xs text-pink-200 font-bold">/ 100</span>
                </div>
              </div>

              {/* Lista dos 7 Critérios */}
              <div className="space-y-3">
                {EVALUATION_CRITERIA.map((crit, index) => {
                  const val = formScores[crit.key]
                  return (
                    <Card
                      key={crit.key}
                      className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-pink-100 text-[#E11D74] font-black text-[11px] flex items-center justify-center">
                              {index + 1}
                            </span>
                            <h3 className="font-extrabold text-sm text-[#1A1A1A]">{crit.label}</h3>
                            {crit.priorityOrder && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-pink-100 text-[#E11D74] border border-pink-200">
                                {crit.priorityOrder}º Desempate
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{crit.description}</p>
                        </div>

                        {/* Input Numérico / Badge de Nota */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Input
                            type="number"
                            min={0}
                            max={crit.max}
                            disabled={isFinalized}
                            value={val}
                            onChange={(e) =>
                              handleScoreChange(crit.key, parseFloat(e.target.value) || 0, crit.max)
                            }
                            className="w-16 h-10 text-center font-black text-base text-[#E11D74] rounded-xl border-slate-300 focus:border-[#E11D74]"
                          />
                          <span className="text-xs font-bold text-slate-400">/ {crit.max}</span>
                        </div>
                      </div>

                      {/* Slider Touch Friendly com bolha */}
                      <div className="pt-2 px-1">
                        <Slider
                          disabled={isFinalized}
                          value={[val]}
                          min={0}
                          max={crit.max}
                          step={1}
                          onValueChange={([newVal]) =>
                            handleScoreChange(crit.key, newVal, crit.max)
                          }
                          className="py-2 cursor-pointer"
                        />
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Feedback Qualitativo (PRD V2 - Observações qualitativas) */}
              <Card className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Parecer Técnico / Observações Construtivas (Obrigatório)
                  </label>
                  <span className="text-[11px] text-slate-400">Será compilado para a startup</span>
                </div>
                <Textarea
                  disabled={isFinalized}
                  placeholder="Descreva pontos fortes do herói, consistência com o tema ESG e oportunidades de melhoria..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="rounded-xl border-slate-300 text-sm focus:border-[#E11D74]"
                />
              </Card>

              {/* Botão de Envio / Revisão */}
              {!isFinalized ? (
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      if (!feedback.trim()) {
                        toast({
                          title: 'Feedback Obrigatório',
                          description:
                            'Por favor, escreva um parecer para a startup antes de revisar.',
                          variant: 'destructive',
                        })
                        return
                      }
                      setReviewMode(true)
                    }}
                    className="w-full h-14 bg-[#E11D74] hover:bg-[#BE185D] text-white font-extrabold text-base rounded-2xl shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>Revisar Nota Total ({calculateTotal()}/100)</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center text-emerald-900 font-bold text-sm">
                  ✓ Avaliação concluída e registrada para {selectedStartup.hero_name}.
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
