import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  startupsService,
  evaluationsService,
  settingsService,
  auditLogsService,
  evaluatorsService,
} from '@/services/api'
import { Startup, Evaluation, AuditLog, StartupRankResult, ESGPillar, EvaluatorUser } from '@/types'
import { calculateRanking, getFileUrl } from '@/lib/ranking'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { EvaluatorModal } from '@/components/EvaluatorModal'
import { EvaluatorQRCodeModal } from '@/components/EvaluatorQRCodeModal'
import { OrganizerModal } from '@/components/OrganizerModal'
import { PostEventReportView } from '@/components/PostEventReportView'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { firePodiumConfetti } from '@/lib/confetti'
import { soundManager } from '@/lib/soundEffects'
import {
  LayoutDashboard,
  Trophy,
  Users,
  Shield,
  ShieldAlert,
  Sparkles,
  Radio,
  Plus,
  Trash2,
  Edit,
  Clock,
  History,
  Unlock,
  AlertTriangle,
  Send,
  Upload,
  RefreshCw,
  FileCheck,
  Zap,
  UserCheck,
  QrCode,
  Power,
  KeyRound,
  FileText,
  Download,
} from 'lucide-react'

export default function AdminPage() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()

  const [startups, setStartups] = useState<Startup[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [evaluators, setEvaluators] = useState<EvaluatorUser[]>([])
  const [organizers, setOrganizers] = useState<EvaluatorUser[]>([])
  const [settingsStatus, setSettingsStatus] = useState<'waiting' | 'published'>('waiting')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [startupModalOpen, setStartupModalOpen] = useState(false)
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null)
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false)
  const [selectedForPenalty, setSelectedForPenalty] = useState<Startup | null>(null)
  const [penaltyValue, setPenaltyValue] = useState<number>(0)

  // Modais de Jurados
  const [evaluatorModalOpen, setEvaluatorModalOpen] = useState(false)
  const [editingEvaluator, setEditingEvaluator] = useState<EvaluatorUser | null>(null)
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false)
  const [selectedEvaluatorForQr, setSelectedEvaluatorForQr] = useState<EvaluatorUser | null>(null)

  // Modais da Comissão Organizadora
  const [organizerModalOpen, setOrganizerModalOpen] = useState(false)
  const [editingOrganizer, setEditingOrganizer] = useState<EvaluatorUser | null>(null)

  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Filtros e busca de Auditoria & Logs
  const [auditSearch, setAuditSearch] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('ALL')

  // Form de Startup
  const [startupName, setStartupName] = useState('')
  const [heroName, setHeroName] = useState('')
  const [estudantes, setEstudantes] = useState('')
  const [esgPillar, setEsgPillar] = useState<ESGPillar>('Ambiental')
  const [synopsis, setSynopsis] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [briefingFile, setBriefingFile] = useState<File | null>(null)
  const [removeBriefing, setRemoveBriefing] = useState(false)
  const [order, setOrder] = useState<number>(1)
  const [savingStartup, setSavingStartup] = useState(false)

  const fetchAllAdminData = async () => {
    try {
      const [startupsList, evalsList, status, logs, evalsUsers] = await Promise.all([
        startupsService.getAll(),
        evaluationsService.getAll(),
        settingsService.getStatus(),
        auditLogsService.getAll(),
        evaluatorsService.getAllUsers(),
      ])
      setStartups(startupsList)
      setEvaluations(evalsList)
      setSettingsStatus(status)
      setAuditLogs(logs)
      // Separar organizadores (role = 'organizer' ou 'admin') e jurados da banca (role = 'evaluator' ou qualquer usuário com is_evaluator = true)
      const orgs = evalsUsers.filter(
        (u) =>
          u.role === 'organizer' ||
          u.role === 'admin' ||
          u.email.toLowerCase() === 'jeangaioso@gmail.com',
      )
      setOrganizers(orgs)

      // Jurados: papel de avaliador ou organizador com condição de avaliador ativa
      const jurados = evalsUsers.filter(
        (u) =>
          u.role === 'evaluator' ||
          (u.role === 'organizer' && u.is_evaluator === true) ||
          (u.role !== 'admin' && u.role !== 'organizer'),
      )
      setEvaluators(jurados)
    } catch (err) {
      console.error('Erro ao buscar dados do admin:', err)
    } finally {
      setLoading(false)
    }
  }

  // Realtime subscriptions
  useRealtime('settings', () => {
    fetchAllAdminData()
  })
  useRealtime('startups', () => {
    fetchAllAdminData()
  })
  useRealtime('evaluations', () => {
    fetchAllAdminData()
  })
  useRealtime('audit_logs', () => {
    fetchAllAdminData()
  })
  useRealtime('users', () => {
    fetchAllAdminData()
  })

  useEffect(() => {
    fetchAllAdminData()
  }, [])

  const ranking = calculateRanking(startups, evaluations)

  // Confete de canhões laterais e comemoração
  const triggerConfetti = () => {
    try {
      // Dispara os canhões laterais direcionados ao topo/centro
      firePodiumConfetti(4500)
      toast({
        title: '🎉 VITRINE PUBLICADA COM SUCESSO! 🎉',
        description:
          'Contagem regressiva de suspense iniciada na Vitrine pública para todos os alunos e familiares!',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  const handlePublish = async () => {
    // Desbloqueia o AudioContext via gesto de clique do admin
    soundManager.unlockAudio().catch(() => {})

    setIsPublishing(true)
    try {
      await settingsService.setStatus('published')
      setSettingsStatus('published')
      await auditLogsService.log(
        'STATUS_PUBLICADO',
        `Vitrine homologada e publicada pelo coordenador ${user?.email}. Contagem de suspense e pódio liberados.`,
      )
      setPublishModalOpen(false)
      triggerConfetti()
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao publicar:', err)
      toast({
        title: 'Erro ao Publicar',
        description: 'Não foi possível alterar o status do evento.',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsPublishing(true)
    try {
      await settingsService.setStatus('waiting')
      setSettingsStatus('waiting')
      await auditLogsService.log(
        'STATUS_AGUARDANDO',
        `Vitrine recolhida para status Aguardando Resultados pelo coordenador ${user?.email}.`,
      )
      setUnpublishModalOpen(false)
      toast({
        title: 'Vitrine em Modo Aguardando',
        description: 'O público agora visualiza o banner de apuração.',
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao recolher:', err)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleOpenStartupModal = (startup?: Startup) => {
    if (startup) {
      setEditingStartup(startup)
      setStartupName(startup.name)
      setHeroName(startup.hero_name)
      setEstudantes(startup.estudantes || '')
      setEsgPillar(startup.esg_pillar)
      setSynopsis(startup.synopsis || '')
      setOrder(startup.order || 1)
    } else {
      setEditingStartup(null)
      setStartupName('')
      setHeroName('')
      setEstudantes('')
      setEsgPillar('Ambiental')
      setSynopsis('')
      setOrder(startups.length + 1)
    }
    setCoverFile(null)
    setBriefingFile(null)
    setRemoveBriefing(false)
    setStartupModalOpen(true)
  }

  const handleSaveStartup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startupName.trim() || !heroName.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Preencha o nome da startup e do herói.',
        variant: 'destructive',
      })
      return
    }

    setSavingStartup(true)
    try {
      const formData = new FormData()
      formData.append('name', startupName.trim())
      formData.append('hero_name', heroName.trim())
      formData.append('estudantes', estudantes.trim())
      formData.append('esg_pillar', esgPillar)
      formData.append('synopsis', synopsis.trim())
      formData.append('order', String(order))

      if (coverFile) {
        formData.append('cover_image', coverFile)
      }

      if (briefingFile) {
        formData.append('briefing_file', briefingFile)
      } else if (removeBriefing) {
        formData.append('briefing_file', '')
      }

      if (editingStartup) {
        await startupsService.update(editingStartup.id, formData)
        await auditLogsService.log(
          'STARTUP_EDITADA',
          `Alteradas informações de ${startupName} (Herói: ${heroName})`,
          startupName,
        )
        toast({ title: 'Startup Atualizada!' })
      } else {
        await startupsService.create(formData)
        await auditLogsService.log(
          'STARTUP_CADASTRADA',
          `Nova startup cadastrada: ${startupName} (Herói: ${heroName})`,
          startupName,
        )
        toast({ title: 'Startup Cadastrada!' })
      }

      setStartupModalOpen(false)
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao salvar startup:', err)
      const errorMsg = getErrorMessage(err)
      toast({
        title: 'Erro ao Salvar Startup',
        description: errorMsg || 'Verifique os dados da startup.',
        variant: 'destructive',
      })
    } finally {
      setSavingStartup(false)
    }
  }

  const handleDeleteStartup = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja remover a startup "${name}" e todas as suas avaliações?`,
      )
    ) {
      return
    }
    try {
      await startupsService.delete(id)
      await auditLogsService.log('STARTUP_EXCLUIDA', `Removida startup ${name}`, name)
      toast({ title: 'Startup Removida' })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao excluir startup:', err)
      const errorMsg = getErrorMessage(err)
      toast({
        title: 'Erro ao Excluir Startup',
        description: errorMsg || 'Não foi possível excluir a startup.',
        variant: 'destructive',
      })
    }
  }

  const handleSavePenalty = async () => {
    if (!selectedForPenalty) return
    try {
      await startupsService.updatePenalty(selectedForPenalty.id, penaltyValue)
      await auditLogsService.log(
        'PENALIDADE_APLICADA',
        `Penalidade de tempo ajustada para ${penaltyValue} ponto(s) para ${selectedForPenalty.name}`,
        selectedForPenalty.name,
      )
      toast({
        title: 'Penalidade Atualizada',
        description: `${penaltyValue} ponto(s) deduzidos da média final.`,
      })
      setPenaltyModalOpen(false)
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao atualizar penalidade:', err)
    }
  }

  const handleUnlockEvaluation = async (evaluationId: string, startupName: string) => {
    if (!window.confirm('Deseja destravar esta avaliação para que o jurado possa editá-la?')) {
      return
    }
    try {
      await evaluationsService.unlockEvaluation(evaluationId)
      await auditLogsService.log(
        'AVALIAÇÃO_DESTRAVADA',
        `A comissão destravou a avaliação da startup ${startupName} para reedição pelo jurado.`,
        startupName,
      )
      toast({
        title: 'Avaliação Destravada',
        description: 'O avaliador já pode atualizar as notas.',
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao destravar:', err)
    }
  }

  // Ações de Gestão de Jurados
  const handleOpenAddEvaluator = () => {
    setEditingEvaluator(null)
    setEvaluatorModalOpen(true)
  }

  const handleOpenEditEvaluator = (evaluator: EvaluatorUser) => {
    setEditingEvaluator(evaluator)
    setEvaluatorModalOpen(true)
  }

  const handleOpenQrCode = (evaluator: EvaluatorUser) => {
    // Clonar para garantir nova referência e re-render imediato
    setSelectedEvaluatorForQr({ ...evaluator })
    setQrCodeModalOpen(true)
  }

  const handleToggleActiveEvaluator = async (evaluator: EvaluatorUser) => {
    const nextState = !evaluator.is_active
    const actionLabel = nextState ? 'Ativar' : 'Desativar'
    if (
      !window.confirm(
        `Tem certeza que deseja ${actionLabel} o acesso do avaliador "${evaluator.name}"? ${
          !nextState
            ? 'O avaliador não conseguirá logar, mas todas as notas atribuídas serão mantidas.'
            : ''
        }`,
      )
    ) {
      return
    }

    try {
      await evaluatorsService.toggleActive(evaluator.id, evaluator.is_active !== false)
      await auditLogsService.log(
        nextState ? 'JURADO_ATIVADO' : 'JURADO_DESATIVADO',
        `A comissão ${actionLabel.toLowerCase()}ou o jurado ${evaluator.name} (${evaluator.email}).`,
      )
      toast({
        title: `Jurado ${nextState ? 'Ativado' : 'Desativado'}`,
        description: nextState
          ? 'O avaliador já pode acessar a banca novamente.'
          : 'Acesso bloqueado sem afetar notas passadas.',
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao alternar status do avaliador:', err)
      const errorMsg = getErrorMessage(err)
      toast({
        title: 'Erro ao Alterar Status',
        description: errorMsg || 'Não foi possível atualizar o status do jurado.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteEvaluator = async (evaluator: EvaluatorUser) => {
    const evalsCount = evaluations.filter((e) => e.evaluator === evaluator.id).length
    const warning =
      evalsCount > 0
        ? `Atenção: este jurado possui ${evalsCount} avaliação(ões) registrada(s). Se preferir mantê-las, utilize a opção "Desativar" em vez de excluir.\n\nDeseja realmente excluir permanentemente o jurado "${evaluator.name}"?`
        : `Tem certeza que deseja excluir o jurado "${evaluator.name}"?`

    if (!window.confirm(warning)) {
      return
    }

    try {
      await evaluatorsService.delete(evaluator.id)
      await auditLogsService.log(
        'JURADO_EXCLUIDO',
        `Jurado ${evaluator.name} (${evaluator.email}) excluído pela comissão.`,
      )
      toast({
        title: 'Jurado Excluído',
        description: `O jurado "${evaluator.name}" foi removido do sistema.`,
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao excluir jurado:', err)
      const errorMsg = getErrorMessage(err)
      toast({
        title: 'Erro ao Excluir Jurado',
        description: errorMsg || 'Não foi possível excluir o jurado.',
        variant: 'destructive',
      })
    }
  }

  const handleResetEvaluatorPassword = async (evaluator: EvaluatorUser) => {
    if (
      !window.confirm(
        `Deseja redefinir a senha do usuário "${evaluator.name}" para a senha padrão "Vivatec@2026"?`,
      )
    ) {
      return
    }
    try {
      await evaluatorsService.resetPassword(evaluator.id, 'Vivatec@2026')
      await auditLogsService.log(
        'SENHA_REDEFINIDA',
        `A comissão redefiniu a senha de ${evaluator.name} (${evaluator.email}) para o padrão Vivatec@2026.`,
      )
      toast({
        title: 'Senha Redefinida!',
        description: 'A senha padrão Vivatec@2026 foi restabelecida com sucesso.',
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      const errorMsg = getErrorMessage(err)
      toast({
        title: 'Erro ao Redefinir Senha',
        description: errorMsg || 'Não foi possível redefinir a senha.',
        variant: 'destructive',
      })
    }
  }

  // Handlers para Comissão Organizadora
  const handleOpenAddOrganizer = () => {
    setEditingOrganizer(null)
    setOrganizerModalOpen(true)
  }

  const handleOpenEditOrganizer = (org: EvaluatorUser) => {
    setEditingOrganizer(org)
    setOrganizerModalOpen(true)
  }

  const handleToggleActiveOrganizer = async (org: EvaluatorUser) => {
    const nextState = org.is_active === false
    try {
      await evaluatorsService.toggleActive(org.id, org.is_active !== false)
      await auditLogsService.log(
        nextState ? 'ORGANIZADOR_ATIVADO' : 'ORGANIZADOR_DESATIVADO',
        `Membro da comissão "${org.name}" foi ${nextState ? 'reativado' : 'desativado'}.`,
      )
      toast({
        title: nextState ? 'Organizador Ativado' : 'Organizador Desativado',
        description: `${org.name} foi ${nextState ? 'reativado' : 'desativado'} com sucesso.`,
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao alterar status do organizador:', err)
      toast({
        title: 'Erro ao Alterar Status',
        description: 'Não foi possível atualizar o status do organizador.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleEvaluatorRole = async (org: EvaluatorUser) => {
    const isCurrentlyEvaluator = org.is_evaluator === true
    try {
      await evaluatorsService.toggleEvaluatorRole(org.id, isCurrentlyEvaluator)
      await auditLogsService.log(
        !isCurrentlyEvaluator ? 'CONDICAO_AVALIADOR_ATIVADA' : 'CONDICAO_AVALIADOR_DESATIVADA',
        `Condição de avaliador para o organizador "${org.name}" (${org.email}) foi ${
          !isCurrentlyEvaluator ? 'ATIVADA' : 'DESATIVADA'
        }.`,
      )
      toast({
        title: !isCurrentlyEvaluator
          ? 'Condição de Avaliador Ativada!'
          : 'Condição de Avaliador Desativada',
        description: !isCurrentlyEvaluator
          ? `${org.name} agora pode acessar o módulo /avaliar e dar notas às startups.`
          : `${org.name} não tem mais acesso de avaliação (mantém acesso administrativo).`,
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao alternar condição de avaliador:', err)
      toast({
        title: 'Erro ao Atualizar Permissão',
        description: 'Não foi possível alterar a condição de avaliador.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteOrganizer = async (org: EvaluatorUser) => {
    if (org.role === 'admin' || org.email.toLowerCase() === 'jeangaioso@gmail.com') {
      toast({
        title: 'Ação Bloqueada',
        description: 'O administrador principal do sistema não pode ser removido.',
        variant: 'destructive',
      })
      return
    }
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o membro da comissão "${org.name}"? Recomendamos apenas desativá-lo para preservar registros.`,
      )
    ) {
      return
    }
    try {
      await evaluatorsService.delete(org.id)
      await auditLogsService.log(
        'ORGANIZADOR_EXCLUIDO',
        `Membro da comissão "${org.name}" (${org.email}) foi excluído do sistema.`,
      )
      toast({
        title: 'Organizador Excluído',
        description: 'O membro foi removido com sucesso.',
      })
      fetchAllAdminData()
    } catch (err) {
      console.error('Erro ao excluir organizador:', err)
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível remover o organizador.',
        variant: 'destructive',
      })
    }
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh]">
        <div className="w-16 h-16 rounded-3xl bg-pink-100 text-[#E11D74] flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2">Acesso Restrito à Comissão</h2>
        <p className="text-sm text-slate-600 mb-6">
          Esta área é exclusiva para a Comissão Organizadora do Viva Tec (Senac/Sesc). Faça login
          como administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#1A1A1A]">
      {/* Top Bar de Controle e Publicação Viva Tec */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-[#2A1525] to-[#E11D74] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-[#E11D74] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#E11D74] text-white">
              Painel Central • Viva Tec
            </span>
            <span className="text-xs text-pink-200">Próxima parada: Ensino Médio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Comando Central de Apuração
          </h1>
          <p className="text-xs sm:text-sm text-pink-100 max-w-xl">
            Monitore o recebimento de notas da banca examinadora, aplique penalidades de tempo
            excedente e publique a Vitrine de Vencedores para todos os espectadores em tempo real.
          </p>
        </div>

        {/* Botão de Ação de Publicação Global (PRD V2 - Controle de Liberação) */}
        <div className="flex flex-wrap items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md">
          <div className="text-right pr-2 hidden sm:block">
            <span className="text-[10px] text-pink-200 uppercase font-bold block">
              Status da Vitrine
            </span>
            <span
              className={`text-xs font-black uppercase ${
                settingsStatus === 'published' ? 'text-emerald-400' : 'text-pink-300'
              }`}
            >
              {settingsStatus === 'published' ? '● PUBLICADA AO VIVO' : '○ AGUARDANDO LIBERAÇÃO'}
            </span>
          </div>

          {settingsStatus === 'waiting' ? (
            <Button
              onClick={() => setPublishModalOpen(true)}
              className="h-12 px-6 bg-[#E11D74] hover:bg-[#BE185D] text-white font-black text-sm rounded-xl shadow-xl flex items-center gap-2 animate-pulse"
            >
              <Zap className="w-5 h-5 text-white" />
              <span>PUBLICAR VITRINE AGORA</span>
            </Button>
          ) : (
            <Button
              onClick={() => setUnpublishModalOpen(true)}
              variant="outline"
              className="h-12 px-5 bg-red-600/80 hover:bg-red-700 text-white border-red-400 font-bold text-xs rounded-xl shadow-md"
            >
              <Radio className="w-4 h-4 mr-1.5" />
              Recolher para "Aguardando"
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Comissão Organizadora
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-[#E11D74]">{organizers.length}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({organizers.filter((o) => o.is_evaluator).length} avaliando)
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Banca Examinadora
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-700">{evaluators.length}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({evaluators.filter((ev) => ev.is_active !== false).length} jurados)
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Líder Provisório
          </span>
          <div className="flex items-baseline justify-between mt-2 truncate">
            <span className="text-xl font-black text-[#E11D74] truncate">
              {ranking[0]?.startup.hero_name || '—'}
            </span>
            <span className="text-xs font-bold text-[#E11D74]">
              {ranking[0]?.finalScore.toFixed(2) || '0.00'} pts
            </span>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Penalidades Aplicadas
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-red-600">
              {startups.filter((s) => (s.time_penalty || 0) > 0).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">startups punidas</span>
          </div>
        </Card>
      </div>

      {/* TABS DO ADMIN: Monitor de Ranking, Gestão de Startups, Avaliações Individuais, Logs de Auditoria */}
      <Tabs defaultValue="monitor" className="w-full space-y-6">
        <TabsList className="bg-slate-200/80 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full gap-1">
          <TabsTrigger
            value="monitor"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
          >
            <Trophy className="w-4 h-4 mr-1.5 inline" /> Monitor & Ranking
          </TabsTrigger>
          <TabsTrigger
            value="organizers"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-1.5 inline" /> Comissão Organizadora
          </TabsTrigger>
          <TabsTrigger
            value="evaluators"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
          >
            <UserCheck className="w-4 h-4 mr-1.5 inline" /> Jurados da Banca
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-1.5 inline" /> Relatório Pós-Evento
          </TabsTrigger>
          <TabsTrigger
            value="startups"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white"
          >
            <Trophy className="w-4 h-4 mr-1.5 inline" /> Startups & Equipes
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-xl text-xs font-bold py-2.5 data-[state=active]:bg-[#E11D74] data-[state=active]:text-white col-span-2 sm:col-span-1"
          >
            <History className="w-4 h-4 mr-1.5 inline" /> Auditoria & Logs
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MONITOR & RANKING EM TEMPO REAL */}
        <TabsContent value="monitor" className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1A1A1A]">
                  Quadro Oficial de Notas e Desempate
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Cálculo automático: Nota Final = (Média Avaliadores) - Penalidades. Desempate: ESG
                  &gt; Criatividade &gt; Engajamento.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllAdminData}
                className="rounded-xl text-xs font-bold h-9 border-pink-200 hover:bg-pink-50 text-[#E11D74]"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Startup & Herói</th>
                    <th className="py-3.5 px-4">Estudantes</th>
                    <th className="py-3.5 px-4 text-center">Pilar ESG</th>
                    <th className="py-3.5 px-4 text-center">Banca (Média)</th>
                    <th className="py-3.5 px-4 text-center">ESG (1º)</th>
                    <th className="py-3.5 px-4 text-center">Criat. (2º)</th>
                    <th className="py-3.5 px-4 text-center">Penalidade</th>
                    <th className="py-3.5 px-4 text-right font-black text-[#E11D74]">Nota Final</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranking.map((item) => (
                    <tr key={item.startup.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                            item.rank === 1
                              ? 'bg-[#E11D74] text-white'
                              : item.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : item.rank === 3
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.rank}º
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-[#1A1A1A]">{item.startup.hero_name}</div>
                        <span className="text-xs text-slate-500">{item.startup.name}</span>
                        {item.tieBreakerReason && (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-pink-900 border border-pink-200">
                              ★ {item.tieBreakerReason}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-xs text-slate-600 line-clamp-1 max-w-[180px]">
                          {item.startup.estudantes || '—'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-semibold">{item.startup.esg_pillar}</span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-[#1A1A1A]">
                          {item.avgTotalEvaluators.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({item.evaluationsCount} notas)
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-emerald-700">
                          {item.avgESG.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-[#E11D74]">
                          {item.avgCriatividade.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedForPenalty(item.startup)
                            setPenaltyValue(item.startup.time_penalty || 0)
                            setPenaltyModalOpen(true)
                          }}
                          className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                            item.timePenalty > 0
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {item.timePenalty > 0 ? `-${item.timePenalty} pts` : '0 min'}
                        </Button>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="text-base font-black text-[#E11D74]">
                          {item.finalScore.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedForPenalty(item.startup)
                            setPenaltyValue(item.startup.time_penalty || 0)
                            setPenaltyModalOpen(true)
                          }}
                          className="h-8 text-xs font-bold rounded-lg hover:border-[#E11D74] hover:text-[#E11D74]"
                        >
                          Penalidade
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: GESTÃO DE STARTUPS, ESTUDANTES & CAPAS */}
        <TabsContent value="startups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#1A1A1A]">
                Startups & Estudantes Cadastrados
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie as equipes de alunos do Viva Tec, heróis fictícios, integrantes e fotos de
                capa para a Vitrine
              </p>
            </div>
            <Button
              onClick={() => handleOpenStartupModal()}
              className="bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Startup
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((s) => {
              const coverUrl = getFileUrl('startups', s.id, s.cover_image)
              return (
                <Card
                  key={s.id}
                  className="p-5 rounded-3xl border-2 border-slate-200 bg-white shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {coverUrl ? (
                      <div className="h-32 w-full rounded-2xl overflow-hidden bg-slate-100">
                        <img
                          src={coverUrl}
                          alt={s.hero_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <Upload className="w-5 h-5 mb-1" />
                        <span>Sem foto de capa</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Ordem: #{s.order || 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-pink-50 text-[#E11D74] border border-pink-200">
                        {s.esg_pillar}
                      </span>
                    </div>

                    <h4 className="font-black text-[#1A1A1A] text-lg">{s.hero_name}</h4>
                    <p className="text-xs font-bold text-[#E11D74]">{s.name}</p>

                    {s.estudantes && (
                      <p className="text-[11px] text-slate-600 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100">
                        👥 <strong>Estudantes:</strong> {s.estudantes}
                      </p>
                    )}

                    {s.briefing_file ? (
                      <div className="flex items-center justify-between p-2 bg-pink-50/70 border border-pink-200 rounded-xl">
                        <span className="text-[11px] font-bold text-[#E11D74] flex items-center gap-1.5 truncate mr-2">
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          Briefing em PDF
                        </span>
                        <a
                          href={getFileUrl('startups', s.id, s.briefing_file) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold bg-[#E11D74] hover:bg-[#BE185D] text-white px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0 transition-colors shadow-xs"
                        >
                          <Download className="w-2.5 h-2.5" />
                          Abrir
                        </a>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-400 italic flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-300" />
                        <span>Briefing ainda não enviado</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 italic">{s.synopsis}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenStartupModal(s)}
                      className="flex-1 h-9 rounded-xl text-xs font-bold"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStartup(s.id, s.name)}
                      className="h-9 px-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* TAB 3: AVALIAÇÕES INDIVIDUAIS DA BANCA (com trava de segurança) */}
        <TabsContent value="evaluations" className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#1A1A1A]">
                Pareceres e Notas Individuais por Jurado
              </h3>
              <p className="text-xs text-slate-500">
                Visualização detalhada das notas individuais da banca examinadora. Conforme PRD
                RNF-03, jurados não veem notas uns dos outros.
              </p>
            </div>

            <div className="space-y-3">
              {evaluations.map((ev) => {
                const totalScore =
                  (ev.score_esg || 0) +
                  (ev.score_criatividade || 0) +
                  (ev.score_engajamento || 0) +
                  (ev.score_figurino || 0) +
                  (ev.score_narrativa || 0) +
                  (ev.score_briefing || 0) +
                  (ev.score_gestao_tempo || 0)

                const startupName = ev.expand?.startup?.name || 'Startup'
                const heroName = ev.expand?.startup?.hero_name || ''
                const evaluatorName = ev.expand?.evaluator?.name || 'Jurado'

                return (
                  <div
                    key={ev.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-bold text-[#1A1A1A] text-sm">
                          {heroName} ({startupName})
                        </strong>
                        {ev.is_finalized ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Bloqueada / Finalizada
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                            Em edição
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Avaliador: <strong className="text-[#E11D74]">{evaluatorName}</strong>
                      </span>
                      {ev.feedback && (
                        <p className="text-xs text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-slate-200 max-w-xl">
                          "{ev.feedback}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
                      <div className="text-right">
                        <span className="text-xl font-black text-[#E11D74]">{totalScore}</span>
                        <span className="text-xs text-slate-400 block">/ 100</span>
                      </div>

                      {ev.is_finalized && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlockEvaluation(ev.id, startupName)}
                          className="h-9 px-3 rounded-xl text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5"
                          title="Permitir que o avaliador reedite as notas"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Destravar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* TAB: GESTÃO DA COMISSÃO ORGANIZADORA (CRUD COMPLETO + TOGGLE AVALIADOR) */}
        <TabsContent value="organizers" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-100 text-[#E11D74] border border-pink-200">
                  Comissão Viva Tec
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Coordenação e Organização
                </span>
              </div>
              <h3 className="text-lg font-black text-[#1A1A1A] mt-1">
                Cadastro da Comissão Organizadora
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie os membros da comissão organizadora com acesso administrativo. Ative ou
                desative individualmente a <strong>condição de avaliador</strong> para permitir ou
                restringir o acesso ao módulo da banca examinadora.
              </p>
            </div>
            <Button
              onClick={handleOpenAddOrganizer}
              className="bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Cadastrar Novo Organizador
            </Button>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Organizador (Nome)</th>
                    <th className="py-3.5 px-4">E-mail / Credencial</th>
                    <th className="py-3.5 px-4 text-center">Papel / Perfil</th>
                    <th className="py-3.5 px-4 text-center">Status Geral</th>
                    <th className="py-3.5 px-4 text-center">Condição de Avaliador</th>
                    <th className="py-3.5 px-4 text-center">Ações & Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organizers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500 italic">
                        Nenhum organizador listado. Clique em "Cadastrar Novo Organizador" acima.
                      </td>
                    </tr>
                  ) : (
                    organizers.map((org) => {
                      const isActive = org.is_active !== false
                      const isEval = org.is_evaluator === true
                      const isSuperAdmin =
                        org.role === 'admin' || org.email.toLowerCase() === 'jeangaioso@gmail.com'

                      return (
                        <tr
                          key={org.id}
                          className={`hover:bg-pink-50/30 transition-colors ${
                            !isActive ? 'opacity-60 bg-slate-50' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  isSuperAdmin
                                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                                    : 'bg-[#E11D74] text-white shadow-sm'
                                }`}
                              >
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-[#1A1A1A] block">{org.name}</span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <span>Token:</span>
                                  <code className="font-mono text-[#E11D74] font-semibold">
                                    {org.quick_token || org.email.split('@')[0]}
                                  </code>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="text-xs text-slate-700 font-medium block">
                              {org.email}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Senha inicial: <code className="text-slate-600">Vivatec@2026</code>
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            {isSuperAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-white">
                                <Shield className="w-3 h-3 text-[#E11D74]" /> Admin Geral
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-[#E11D74] border border-pink-200">
                                <Users className="w-3 h-3" /> Comissão
                              </span>
                            )}
                          </td>

                          {/* Status Geral (Ativo/Desativado) */}
                          <td className="py-4 px-4 text-center">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{' '}
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                                Desativado
                              </span>
                            )}
                          </td>

                          {/* BOTÃO ATIVAR/DESATIVAR CONDIÇÃO DE AVALIADOR */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleEvaluatorRole(org)}
                                disabled={!isActive}
                                className={`h-8 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isEval
                                    ? 'bg-pink-50 border-[#E11D74] text-[#E11D74] hover:bg-pink-100 hover:border-[#BE185D]'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                                }`}
                                title={
                                  isEval
                                    ? 'Clique para desativar a condição de avaliador'
                                    : 'Clique para ativar a condição de avaliador deste organizador'
                                }
                              >
                                <Power
                                  className={`w-3.5 h-3.5 ${
                                    isEval ? 'text-[#E11D74]' : 'text-slate-400'
                                  }`}
                                />
                                <span>{isEval ? 'Avaliador: ATIVO' : 'Avaliador: NÃO'}</span>
                              </Button>
                              <span className="text-[10px] text-slate-400 leading-tight">
                                {isEval ? 'Aparece na banca e avalia' : 'Apenas administrativo'}
                              </span>
                            </div>
                          </td>

                          {/* Ações & Acesso */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botão QR Code & Token */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenQrCode(org)}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold border-pink-200 hover:bg-pink-50 text-[#E11D74]"
                                title="Visualizar QR Code e credencial de login rápido"
                              >
                                <QrCode className="w-3.5 h-3.5 mr-1" />
                                <span>QR / Token</span>
                              </Button>

                              {/* Botão Editar Dados Básicos */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditOrganizer(org)}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                                title="Editar dados, e-mail e permissão"
                              >
                                <Edit className="w-3.5 h-3.5 mr-1" />
                                <span>Editar</span>
                              </Button>

                              {/* Botão Redefinir Senha */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetEvaluatorPassword(org)}
                                className="h-8 px-2 rounded-lg text-xs font-bold text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                title="Redefinir senha para Vivatec@2026"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </Button>

                              {/* Botão Ativar / Desativar Organizador */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActiveOrganizer(org)}
                                disabled={isSuperAdmin}
                                className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                                  isActive
                                    ? 'text-amber-700 hover:bg-amber-50'
                                    : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                                }`}
                                title={
                                  isActive
                                    ? 'Desativar organizador (impede login sem apagar histórico)'
                                    : 'Reativar organizador'
                                }
                              >
                                <Power className="w-3.5 h-3.5 mr-1" />
                                <span>{isActive ? 'Desativar' : 'Ativar'}</span>
                              </Button>

                              {/* Botão Excluir */}
                              {!isSuperAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteOrganizer(org)}
                                  className="h-8 px-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                                  title="Excluir organizador permanentemente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: GESTÃO DE JURADOS DA BANCA (PENDÊNCIA 1) */}
        <TabsContent value="evaluators" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-[#1A1A1A]">
                Gestão dos Jurados da Banca Examinadora
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre novos avaliadores, gere QR Codes/tokens de acesso rápido, edite dados e
                ative ou desative credenciais mantendo a integridade das avaliações já salvas.
              </p>
            </div>
            <Button
              onClick={handleOpenAddEvaluator}
              className="bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Cadastrar Novo Jurado
            </Button>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Avaliador (Nome)</th>
                    <th className="py-3.5 px-4">E-mail</th>
                    <th className="py-3.5 px-4 text-center">Código / Token Rápido</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Avaliações Feitas</th>
                    <th className="py-3.5 px-4 text-center">Ações & Acesso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-500 italic">
                        Nenhum avaliador cadastrado ainda. Clique em "Cadastrar Novo Jurado" acima.
                      </td>
                    </tr>
                  ) : (
                    evaluators.map((ev) => {
                      const evalsCount = evaluations.filter((e) => e.evaluator === ev.id).length
                      const isActive = ev.is_active !== false

                      return (
                        <tr
                          key={ev.id}
                          className={`hover:bg-pink-50/30 transition-colors ${
                            !isActive ? 'opacity-60 bg-slate-50' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#E11D74] text-white flex items-center justify-center font-bold text-xs">
                                {ev.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-[#1A1A1A] block">{ev.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  ID: {ev.id.substring(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="text-xs text-slate-700 font-medium">{ev.email}</span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#E11D74]">
                              {ev.quick_token || ev.email.split('@')[0]}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{' '}
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                                Desativado
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className="text-xs font-bold text-slate-800">{evalsCount}</span>
                            <span className="text-[10px] text-slate-400 block">
                              de {startups.length} startups
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Botão QR Code & Token */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenQrCode(ev)}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold border-pink-200 hover:bg-pink-50 text-[#E11D74]"
                                title="Visualizar QR Code e credencial de login rápido"
                              >
                                <QrCode className="w-3.5 h-3.5 mr-1" />
                                <span>QR / Token</span>
                              </Button>

                              {/* Botão Editar Dados Básicos */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditEvaluator(ev)}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                                title="Editar nome, e-mail ou redefinir senha"
                              >
                                <Edit className="w-3.5 h-3.5 mr-1" />
                                <span>Editar</span>
                              </Button>

                              {/* Botão Redefinir Senha */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetEvaluatorPassword(ev)}
                                className="h-8 px-2 rounded-lg text-xs font-bold text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                title="Redefinir senha para Vivatec@2026"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </Button>

                              {/* Botão Ativar / Desativar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActiveEvaluator(ev)}
                                className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                                  isActive
                                    ? 'text-amber-700 hover:bg-amber-50'
                                    : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                                }`}
                                title={
                                  isActive
                                    ? 'Desativar avaliador (impede login sem apagar avaliações)'
                                    : 'Reativar avaliador'
                                }
                              >
                                <Power className="w-3.5 h-3.5 mr-1" />
                                <span>{isActive ? 'Desativar' : 'Ativar'}</span>
                              </Button>

                              {/* Botão Excluir Avaliador */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvaluator(ev)}
                                className="h-8 px-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Excluir jurado permanentemente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: RELATÓRIO PÓS-EVENTO & EXPORTAÇÃO PDF (PENDÊNCIAS 2 & 3) */}
        <TabsContent value="report" className="space-y-4">
          <PostEventReportView
            ranking={ranking}
            eventName="Festival de Apresentação Artística de Heróis Fictícios • Viva Tec"
            generatedBy={user?.name || 'Comissão Organizadora Sesc/Senac'}
          />
        </TabsContent>

        {/* TAB 5: AUDITORIA E LOGS DO SISTEMA */}
        <TabsContent value="audit" className="space-y-4">
          {(() => {
            // Filtragem dos logs
            const filteredAuditLogs = auditLogs.filter((log) => {
              if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) {
                return false
              }
              if (auditSearch.trim()) {
                const term = auditSearch.toLowerCase()
                const actionMatch = log.action?.toLowerCase().includes(term)
                const detailsMatch = log.details?.toLowerCase().includes(term)
                const emailMatch = log.user_email?.toLowerCase().includes(term)
                const startupMatch = log.startup_name?.toLowerCase().includes(term)
                if (!actionMatch && !detailsMatch && !emailMatch && !startupMatch) {
                  return false
                }
              }
              return true
            })

            // Lista de ações distintas para o select de filtro
            const uniqueActions = Array.from(
              new Set(auditLogs.map((l) => l.action).filter(Boolean)),
            ).sort()

            // Função para formatar data e hora com fallback seguro
            const formatDateTimeFull = (isoString?: string) => {
              if (!isoString) return { full: '—', date: '—', time: '—' }
              try {
                const d = new Date(isoString)
                if (isNaN(d.getTime())) return { full: '—', date: '—', time: '—' }
                const pad = (n: number) => String(n).padStart(2, '0')
                const dia = pad(d.getDate())
                const mes = pad(d.getMonth() + 1)
                const ano = d.getFullYear()
                const hora = pad(d.getHours())
                const min = pad(d.getMinutes())
                const seg = pad(d.getSeconds())
                return {
                  full: `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`,
                  date: `${dia}/${mes}/${ano}`,
                  time: `${hora}:${min}:${seg}`,
                }
              } catch {
                return { full: '—', date: '—', time: '—' }
              }
            }

            // Exportação para CSV (compatível com Excel)
            const handleExportAuditLogs = () => {
              if (filteredAuditLogs.length === 0) {
                toast({
                  title: 'Nenhum registro para exportar',
                  description: 'Não há registros de auditoria correspondentes aos filtros atuais.',
                  variant: 'destructive',
                })
                return
              }

              const escapeCsv = (val?: string | null) => {
                if (val === undefined || val === null) return '""'
                const str = String(val).replace(/"/g, '""')
                return `"${str}"`
              }

              // Cabeçalhos em português com separador ponto-e-vírgula (padrão Excel pt-BR)
              const headers = [
                'Data / Hora',
                'Ação',
                'Startup / Alvo',
                'Detalhes',
                'Responsável (E-mail)',
                'ID do Registro',
              ]

              const rows = filteredAuditLogs.map((log) => {
                const dt = formatDateTimeFull(log.created)
                return [
                  escapeCsv(dt.full),
                  escapeCsv(log.action),
                  escapeCsv(log.startup_name || ''),
                  escapeCsv(log.details || ''),
                  escapeCsv(log.user_email || ''),
                  escapeCsv(log.id),
                ].join(';')
              })

              // Adicionar BOM UTF-8 (\uFEFF) para que o Excel abra com acentos corretos automaticamente
              const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')

              const now = new Date()
              const pad = (n: number) => String(n).padStart(2, '0')
              const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
              link.href = url
              link.setAttribute('download', `auditoria-vivatec-${dateStr}.csv`)
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)

              toast({
                title: 'Download Concluído',
                description: `Exportados ${filteredAuditLogs.length} registro(s) de auditoria com sucesso.`,
              })
            }

            return (
              <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
                      <span>Registro de Auditoria & Trilha de Integridade</span>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold bg-pink-50 text-[#E11D74] border-pink-200"
                      >
                        {filteredAuditLogs.length}{' '}
                        {filteredAuditLogs.length === 1 ? 'registro' : 'registros'}
                        {filteredAuditLogs.length !== auditLogs.length &&
                          ` (de ${auditLogs.length})`}
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Histórico imutável de todas as notas computadas, penalidades inseridas e
                      publicação de resultados
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fetchAllAdminData}
                      className="rounded-xl text-xs font-bold h-9 border-slate-200 hover:bg-slate-50 text-slate-700"
                      title="Recarregar registros"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Atualizar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleExportAuditLogs}
                      className="rounded-xl text-xs font-black h-9 px-4 bg-[#E11D74] hover:bg-[#BE185D] text-white shadow-md flex items-center gap-2 transition-all"
                      title="Baixar auditoria em formato CSV compatível com Excel"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar Logs (CSV)</span>
                    </Button>
                  </div>
                </div>

                {/* Filtros da auditoria */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-7 lg:col-span-8">
                    <Input
                      placeholder="Buscar por ação, startup, detalhes ou e-mail..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="h-9 rounded-xl text-xs"
                    />
                  </div>
                  <div className="sm:col-span-5 lg:col-span-4">
                    <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                      <SelectTrigger className="h-9 rounded-xl text-xs">
                        <SelectValue placeholder="Todas as ações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas as Ações ({auditLogs.length})</SelectItem>
                        {uniqueActions.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lista de Registros */}
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                  {filteredAuditLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <History className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-medium">
                        Nenhum registro de auditoria encontrado.
                      </p>
                      {(auditSearch || auditActionFilter !== 'ALL') && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAuditSearch('')
                            setAuditActionFilter('ALL')
                          }}
                          className="text-xs text-[#E11D74] hover:bg-pink-50 h-8"
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const dt = formatDateTimeFull(log.created)
                      return (
                        <div
                          key={log.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 text-xs hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-[#E11D74] bg-pink-50 px-2 py-0.5 rounded border border-pink-100 text-[11px]">
                                {log.action}
                              </span>
                              {log.startup_name && (
                                <span className="font-bold text-slate-800">
                                  [{log.startup_name}]
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1 break-words">{log.details}</p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Responsável:{' '}
                              <strong className="font-medium text-slate-500">
                                {log.user_email || '—'}
                              </strong>
                            </span>
                          </div>

                          {/* Data e hora completa formatada (dd/mm/aaaa hh:mm:ss, pt-BR) com badge e estilo Viva Tec */}
                          <div className="sm:text-right flex-shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] shadow-xs">
                              <Clock className="w-3 h-3 text-[#E11D74] flex-shrink-0" />
                              <span className="font-bold text-slate-800">{dt.date}</span>
                              <span className="text-slate-500 font-medium">{dt.time}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>

      {/* MODAL DE CADASTRO/EDIÇÃO DE STARTUP COM ESTUDANTES */}
      <Dialog open={startupModalOpen} onOpenChange={setStartupModalOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-6 bg-white rounded-3xl border-2 border-pink-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1A1A1A]">
              {editingStartup ? 'Editar Startup & Herói' : 'Cadastrar Nova Startup'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Insira os dados da startup, estudantes e herói para o Festival Viva Tec
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStartup} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Nome da Startup / Equipe *</label>
              <Input
                placeholder="Ex: Eco-Guardians"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Nome do Herói Fictício *</label>
              <Input
                placeholder="Ex: Terra-Man"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            {/* Campo Estudantes (PRD V2) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#E11D74]">
                Estudantes / Integrantes da Equipe
              </label>
              <Input
                placeholder="Ex: Ana Beatriz Lima, Carlos Eduardo Rocha, Larissa Santos..."
                value={estudantes}
                onChange={(e) => setEstudantes(e.target.value)}
                className="h-10 rounded-xl border-pink-200 focus:border-[#E11D74]"
              />
              <span className="text-[10px] text-slate-400 block">
                Nomes que aparecerão no Pódio e na Vitrine de Vencedores
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">Pilar ESG Principal *</label>
                <Select value={esgPillar} onValueChange={(v: ESGPillar) => setEsgPillar(v)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ambiental">Ambiental</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Governança">Governança</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">Ordem de Apresentação</label>
                <Input
                  type="number"
                  min={1}
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">
                Sinopse da Jornada do Herói
              </label>
              <Textarea
                placeholder="Breve resumo da história, poderes e impacto no mundo..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">
                Foto de Capa do Herói (Vitrine - RF-05)
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCoverFile(e.target.files[0])
                  }
                }}
                className="h-10 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E11D74] file:text-white"
              />
            </div>

            {/* Campo Upload do Briefing (Documento de Avaliação em PDF) */}
            <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#E11D74]" />
                    Documento de Briefing (PDF)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Critério de avaliação da banca (Score Briefing - máx 20MB)
                  </p>
                </div>
                {editingStartup?.briefing_file && !removeBriefing && !briefingFile && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-pink-50 text-[#E11D74] border-pink-200"
                  >
                    PDF Cadastrado
                  </Badge>
                )}
              </div>

              {/* Status do arquivo atual na edição */}
              {editingStartup?.briefing_file && !removeBriefing && !briefingFile && (
                <div className="flex items-center justify-between p-2.5 bg-white border border-pink-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate font-medium text-slate-700">
                      {editingStartup.briefing_file}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <a
                      href={
                        getFileUrl('startups', editingStartup.id, editingStartup.briefing_file) ||
                        '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#E11D74] bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Visualizar
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveBriefing(true)}
                      className="h-7 px-2 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              )}

              {/* Aviso se usuário marcou para remover */}
              {removeBriefing && (
                <div className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <span>O briefing atual será removido ao salvar.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveBriefing(false)}
                    className="h-6 px-2 text-[10px] font-bold text-slate-600 hover:bg-white rounded-lg"
                  >
                    Desfazer
                  </Button>
                </div>
              )}

              {/* Input de arquivo PDF com validação */}
              <div className="space-y-1">
                <Input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // Validação de tipo (PDF)
                    if (
                      file.type !== 'application/pdf' &&
                      !file.name.toLowerCase().endsWith('.pdf')
                    ) {
                      toast({
                        title: 'Formato Inválido',
                        description: 'O briefing deve ser exclusivamente um arquivo PDF.',
                        variant: 'destructive',
                      })
                      e.target.value = ''
                      return
                    }

                    // Validação de tamanho (máximo 20 MB)
                    const maxSize = 20 * 1024 * 1024
                    if (file.size > maxSize) {
                      toast({
                        title: 'Arquivo Muito Grande',
                        description: 'O arquivo PDF não pode ultrapassar 20 MB.',
                        variant: 'destructive',
                      })
                      e.target.value = ''
                      return
                    }

                    setBriefingFile(file)
                    setRemoveBriefing(false)
                  }}
                  className="h-10 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1A1A1A] file:text-white"
                />
                {briefingFile && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    Novo arquivo selecionado: {briefingFile.name} (
                    {(briefingFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStartupModalOpen(false)}
                className="h-10 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingStartup}
                className="h-10 px-5 bg-[#E11D74] hover:bg-[#BE185D] text-white font-bold text-xs rounded-xl shadow-md"
              >
                {savingStartup ? 'Salvando...' : 'Salvar Startup'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE APLICAÇÃO DE PENALIDADES (PRD RF-03 / Regra 1) */}
      <Dialog open={penaltyModalOpen} onOpenChange={setPenaltyModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 bg-white rounded-3xl border-2 border-red-200 shadow-2xl">
          <DialogHeader className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-1">
              <Clock className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Penalidade de Tempo / Conduta
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Startup: <strong>{selectedForPenalty?.name}</strong> ({selectedForPenalty?.hero_name})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              Cada ponto de penalidade é subtraído <strong>diretamente da média aritmética</strong>{' '}
              final dos jurados.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Pontos de Penalidade (Minutos Excedentes)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={penaltyValue}
                  onChange={(e) => setPenaltyValue(parseFloat(e.target.value) || 0)}
                  className="h-12 text-center text-lg font-black text-red-700 rounded-xl border-red-200 focus:border-red-500"
                />
                <span className="text-xs font-bold text-slate-500">pontos</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPenaltyModalOpen(false)}
              className="h-10 rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePenalty}
              className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Aplicar Penalidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE PUBLICAÇÃO GLOBAL */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-3xl border-4 border-[#E11D74] shadow-2xl text-center">
          <DialogHeader className="space-y-2">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-[#E11D74] text-white flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-[#1A1A1A]">
              Homologar & Publicar Resultados
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Tem certeza que deseja liberar a Vitrine de Vencedores com o Pódio Oficial Viva Tec
              para toda a comunidade escolar?
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 text-xs bg-pink-50/50 rounded-2xl p-4 border border-pink-200 text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">1º Lugar Homologado:</span>
              <strong className="text-[#E11D74] font-bold">
                {ranking[0]?.startup.hero_name} ({ranking[0]?.finalScore.toFixed(2)} pts)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total de Startups Classificadas:</span>
              <strong className="text-slate-800">{ranking.length} equipes</strong>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setPublishModalOpen(false)}
              className="w-full sm:w-auto h-11 rounded-xl text-xs font-bold"
            >
              Revisar Mais Uma Vez
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full sm:w-auto h-11 bg-[#E11D74] hover:bg-[#BE185D] text-white font-black text-xs rounded-xl shadow-lg flex-1"
            >
              {isPublishing ? 'Publicando...' : 'Confirmar e Abrir Pódio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO PARA RECOLHER RESULTADOS */}
      <Dialog open={unpublishModalOpen} onOpenChange={setUnpublishModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 bg-white rounded-3xl border-2 border-red-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-700">
              Recolher Vitrine para "Aguardando"
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              A tela pública voltará ao estado de espera até uma nova publicação.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setUnpublishModalOpen(false)}
              className="h-10 rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={isPublishing}
              className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
            >
              Recolher Vitrine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CADASTRO/EDIÇÃO DE ORGANIZADOR DA COMISSÃO */}
      <OrganizerModal
        isOpen={organizerModalOpen}
        onClose={() => setOrganizerModalOpen(false)}
        organizer={editingOrganizer}
        onSuccess={fetchAllAdminData}
      />

      {/* MODAL DE CADASTRO/EDIÇÃO DE JURADO (PENDÊNCIA 1) */}
      <EvaluatorModal
        isOpen={evaluatorModalOpen}
        onClose={() => setEvaluatorModalOpen(false)}
        evaluator={editingEvaluator}
        onSuccess={fetchAllAdminData}
      />

      {/* MODAL DE QR CODE E TOKEN DE ACESSO DO JURADO (PENDÊNCIA 1) */}
      <EvaluatorQRCodeModal
        isOpen={qrCodeModalOpen}
        onClose={() => setQrCodeModalOpen(false)}
        evaluator={selectedEvaluatorForQr}
      />
    </div>
  )
}
