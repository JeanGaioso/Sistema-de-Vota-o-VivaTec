import { useState, useEffect } from 'react'
import { startupsService, evaluationsService, settingsService } from '@/services/api'
import { Startup, Evaluation, StartupRankResult } from '@/types'
import { calculateRanking, getFileUrl } from '@/lib/ranking'
import { useRealtime } from '@/hooks/use-realtime'
import { StartupDetailModal } from '@/components/StartupDetailModal'
import { ShareQRCodeModal } from '@/components/ShareQRCodeModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Trophy,
  Award,
  Crown,
  Sparkles,
  QrCode,
  Leaf,
  Users,
  Building,
  ChevronRight,
  ShieldAlert,
  Flame,
  Radio,
  Clock,
  RefreshCw,
} from 'lucide-react'

export default function Index() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [eventStatus, setEventStatus] = useState<'waiting' | 'published'>('waiting')
  const [loading, setLoading] = useState(true)
  const [selectedRankResult, setSelectedRankResult] = useState<StartupRankResult | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const [startupsList, evalList, status] = await Promise.all([
        startupsService.getAll(),
        evaluationsService.getAll(),
        settingsService.getStatus(),
      ])
      setStartups(startupsList)
      setEvaluations(evalList)
      setEventStatus(status)
    } catch (err) {
      console.error('Erro ao buscar dados da vitrine:', err)
    } finally {
      setLoading(false)
    }
  }

  // Realtime hook nas coleções do PocketBase
  useRealtime('settings', () => {
    fetchData()
  })
  useRealtime('startups', () => {
    fetchData()
  })
  useRealtime('evaluations', () => {
    fetchData()
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Cálculo de ranking oficial
  const ranking = calculateRanking(startups, evaluations)
  const top1 = ranking[0]
  const top2 = ranking[1]
  const top3 = ranking[2]
  const restRank = ranking.slice(3)

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[60vh]">
        <RefreshCw className="w-10 h-10 text-[#1A237E] animate-spin mb-4" />
        <p className="text-sm font-bold text-[#1A237E]">Carregando Vitrine Oficial Sesc...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col pb-16">
      {/* Banner Principal do Festival */}
      <section className="relative bg-gradient-to-br from-[#1A237E] via-[#283593] to-[#0D47A1] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#FFD600] overflow-hidden">
        {/* Elementos decorativos hero */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FFD600]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD600]/20 border border-[#FFD600]/40 text-[#FFD600] text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Festival Oficial de Heróis Fictícios
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Vitrine de <span className="text-[#FFD600] drop-shadow-md">Vencedores</span>
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl font-medium">
              Escola Educar Sesc Monsenhor Jonas Abib • Apresentações Artísticas, Inovação e Impacto
              ESG
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setQrModalOpen(true)}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-2xl h-11 px-4 font-bold text-xs flex items-center gap-2 shadow-md backdrop-blur-sm"
            >
              <QrCode className="w-4 h-4 text-[#FFD600]" />
              <span>QR Code para Comunidade</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ESTADO 1: AGUARDANDO RESULTADOS (PRD 7 - Vitrine fica em "Aguardando" até liberação admin) */}
      {eventStatus === 'waiting' ? (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8 flex-1 flex flex-col justify-center">
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#1A237E] flex items-center justify-center text-[#FFD600] shadow-2xl border-4 border-[#FFD600] animate-bounce">
            <Radio className="w-12 h-12 text-[#FFD600] animate-pulse" />
          </div>

          <div className="space-y-3">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 inline-block">
              Apuração Oficial em Andamento
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A237E] tracking-tight">
              Aguardando Publicação da Banca
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              Os avaliadores da banca examinadora e a comissão organizadora do Sesc estão
              finalizando as notas e aplicando critérios de desempate. O pódio será transmitido aqui
              instantaneamente!
            </p>
          </div>

          {/* Cards das Startups em Apresentação */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Startups & Heróis Concorrentes da Noite ({startups.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {startups.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-left hover:border-[#1A237E]/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Herói
                    </span>
                    {getPillarBadge(s.esg_pillar)}
                  </div>
                  <h4 className="font-black text-[#1A237E] text-base truncate">{s.hero_name}</h4>
                  <p className="text-xs text-slate-600 font-medium truncate">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ESTADO 2: PUBLICADO - PÓDIO ANIMADO & RANKING GERAL COMPLETO */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Header de Resultados Publicados */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-sm text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold">Resultado Oficial Homologado!</strong>
                <span className="text-xs text-emerald-800">
                  Média de notas e critérios de desempate processados com sucesso.
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 uppercase tracking-wider">
              100% Apurado
            </span>
          </div>

          {/* PÓDIO HEROICO (1º, 2º e 3º Lugares com animação escalonada 500ms) */}
          {ranking.length > 0 && (
            <section className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-[#1A237E] tracking-tight">
                  Pódio dos Campeões
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Os maiores heróis fictícios e propostas de inovação do Festival Sesc
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
                {/* 2º LUGAR (Prata) */}
                {top2 && (
                  <div className="order-2 md:order-1 podium-2">
                    <Card
                      onClick={() => setSelectedRankResult(top2)}
                      className="cursor-pointer group relative overflow-hidden bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="absolute top-0 right-0 left-0 h-3 bg-slate-300" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 font-black text-lg flex items-center justify-center border border-slate-300 shadow-sm">
                          2º
                        </span>
                        {getPillarBadge(top2.startup.esg_pillar)}
                      </div>

                      {/* Capa se houver */}
                      {top2.startup.cover_image && (
                        <div className="h-28 w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                          <img
                            src={
                              getFileUrl('startups', top2.startup.id, top2.startup.cover_image) ||
                              ''
                            }
                            alt={top2.startup.hero_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                        Herói Fictício
                      </span>
                      <h3 className="text-xl font-black text-[#1A237E] truncate">
                        {top2.startup.hero_name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 mb-4">
                        {top2.startup.name}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Média Final:</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#1A237E]">
                            {top2.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ 100</span>
                        </div>
                      </div>

                      {top2.tieBreakerReason && (
                        <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-center">
                          ★ {top2.tieBreakerReason}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* 1º LUGAR (Ouro - Destaque Principal) */}
                {top1 && (
                  <div className="order-1 md:order-2 podium-1">
                    <Card
                      onClick={() => setSelectedRankResult(top1)}
                      className="cursor-pointer group relative overflow-hidden bg-gradient-to-b from-amber-50 to-white border-4 border-[#FFD600] rounded-3xl p-7 shadow-2xl hover:shadow-[0_20px_50px_rgba(255,214,0,0.3)] transition-all hover:-translate-y-2 glow-gold"
                    >
                      <div className="absolute top-0 right-0 left-0 h-4 bg-[#FFD600]" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-14 h-14 rounded-2xl bg-[#FFD600] text-[#1A237E] font-black text-2xl flex items-center justify-center border-2 border-amber-300 shadow-md">
                          <Crown className="w-8 h-8 text-[#1A237E]" />
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFD600] text-[#1A237E]">
                            1º Campeão Geral
                          </span>
                          {getPillarBadge(top1.startup.esg_pillar)}
                        </div>
                      </div>

                      {/* Capa */}
                      {top1.startup.cover_image && (
                        <div className="h-36 w-full rounded-2xl overflow-hidden mb-3 bg-amber-100 shadow-inner">
                          <img
                            src={
                              getFileUrl('startups', top1.startup.id, top1.startup.cover_image) ||
                              ''
                            }
                            alt={top1.startup.hero_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <span className="text-xs font-extrabold text-amber-600 uppercase tracking-widest block">
                        Grande Herói Vencedor
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-[#1A237E] tracking-tight truncate">
                        {top1.startup.hero_name}
                      </h3>
                      <p className="text-sm font-bold text-slate-700 mb-4">{top1.startup.name}</p>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-4 font-medium italic">
                        "{top1.startup.synopsis}"
                      </p>

                      <div className="pt-3 border-t-2 border-amber-200 flex items-baseline justify-between bg-white/80 p-3 rounded-2xl">
                        <span className="text-xs font-bold text-[#1A237E]">Nota Final Campeã:</span>
                        <div className="text-right">
                          <span className="text-3xl font-black text-[#1A237E]">
                            {top1.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-bold">pontos</span>
                        </div>
                      </div>

                      {top1.tieBreakerReason && (
                        <div className="mt-3 text-xs font-bold text-amber-800 bg-amber-100 p-2 rounded-xl border border-amber-300 text-center">
                          ★ {top1.tieBreakerReason}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* 3º LUGAR (Bronze) */}
                {top3 && (
                  <div className="order-3 md:order-3 podium-3">
                    <Card
                      onClick={() => setSelectedRankResult(top3)}
                      className="cursor-pointer group relative overflow-hidden bg-white border-2 border-amber-600/30 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="absolute top-0 right-0 left-0 h-3 bg-amber-700" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 font-black text-lg flex items-center justify-center border border-amber-300 shadow-sm">
                          3º
                        </span>
                        {getPillarBadge(top3.startup.esg_pillar)}
                      </div>

                      {/* Capa */}
                      {top3.startup.cover_image && (
                        <div className="h-28 w-full rounded-xl overflow-hidden mb-3 bg-amber-50">
                          <img
                            src={
                              getFileUrl('startups', top3.startup.id, top3.startup.cover_image) ||
                              ''
                            }
                            alt={top3.startup.hero_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                        Herói Fictício
                      </span>
                      <h3 className="text-xl font-black text-[#1A237E] truncate">
                        {top3.startup.hero_name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 mb-4">
                        {top3.startup.name}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Média Final:</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#1A237E]">
                            {top3.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ 100</span>
                        </div>
                      </div>

                      {top3.tieBreakerReason && (
                        <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-center">
                          ★ {top3.tieBreakerReason}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TABELA DE RANKING GERAL COMPLETA */}
          <section className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#1A237E] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FFD600]" />
                  Classificação Geral de Todas as Startups
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Clique em qualquer startup para visualizar detalhamento das notas, pilar ESG e
                  sinopse
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Total de equipes: {ranking.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/75 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-16">Posição</th>
                    <th className="py-3.5 px-4">Startup & Herói</th>
                    <th className="py-3.5 px-4">Pilar ESG</th>
                    <th className="py-3.5 px-4 text-center hidden md:table-cell">Avaliadores</th>
                    <th className="py-3.5 px-4 text-center hidden lg:table-cell">ESG / Criat.</th>
                    <th className="py-3.5 px-4 text-center hidden sm:table-cell">Penalidades</th>
                    <th className="py-3.5 px-4 text-right font-black text-[#1A237E]">Nota Final</th>
                    <th className="py-3.5 px-4 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranking.map((item) => (
                    <tr
                      key={item.startup.id}
                      onClick={() => setSelectedRankResult(item)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Posição */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                            item.rank === 1
                              ? 'bg-[#FFD600] text-[#1A237E] font-black'
                              : item.rank === 2
                                ? 'bg-slate-200 text-slate-700'
                                : item.rank === 3
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'text-slate-500 bg-slate-100'
                          }`}
                        >
                          {item.rank}º
                        </span>
                      </td>

                      {/* Startup & Herói */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#1A237E]/10 text-[#1A237E] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {item.startup.hero_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-[#1A237E] flex items-center gap-2">
                              <span>{item.startup.hero_name}</span>
                              {item.tieBreakerReason && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-900 border-amber-300"
                                >
                                  Desempate: {item.tieBreakerReason}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {item.startup.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ESG */}
                      <td className="py-4 px-4">{getPillarBadge(item.startup.esg_pillar)}</td>

                      {/* Qtd Avaliadores */}
                      <td className="py-4 px-4 text-center hidden md:table-cell">
                        <span className="text-xs font-semibold text-slate-600">
                          {item.evaluationsCount} parecer(es)
                        </span>
                      </td>

                      {/* Destaque ESG / Criatividade */}
                      <td className="py-4 px-4 text-center hidden lg:table-cell text-xs font-medium text-slate-600">
                        <span className="text-emerald-700 font-bold">{item.avgESG}</span> /{' '}
                        <span className="text-indigo-700 font-bold">{item.avgCriatividade}</span>
                      </td>

                      {/* Penalidades */}
                      <td className="py-4 px-4 text-center hidden sm:table-cell">
                        {item.timePenalty > 0 ? (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                            -{item.timePenalty} pts
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">0</span>
                        )}
                      </td>

                      {/* Nota Final */}
                      <td className="py-4 px-4 text-right font-black text-base text-[#1A237E]">
                        {item.finalScore.toFixed(2)}
                      </td>

                      {/* Ação */}
                      <td className="py-4 px-4 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1A237E] transition-transform group-hover:translate-x-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Modal de Detalhes da Startup */}
      <StartupDetailModal
        rankResult={selectedRankResult}
        isOpen={!!selectedRankResult}
        onClose={() => setSelectedRankResult(null)}
      />

      {/* Modal de Compartilhamento / QR Code */}
      <ShareQRCodeModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  )
}
