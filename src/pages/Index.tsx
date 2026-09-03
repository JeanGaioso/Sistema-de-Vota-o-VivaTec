import { useState, useEffect } from 'react'
import { startupsService, evaluationsService, settingsService } from '@/services/api'
import { Startup, Evaluation, StartupRankResult } from '@/types'
import { calculateRanking, getFileUrl } from '@/lib/ranking'
import { useRealtime } from '@/hooks/use-realtime'
import { StartupDetailModal } from '@/components/StartupDetailModal'
import { ShareQRCodeModal } from '@/components/ShareQRCodeModal'
import { VivaTecLogo } from '@/components/VivaTecLogo'
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
        <RefreshCw className="w-10 h-10 text-[#E11D74] animate-spin mb-4" />
        <p className="text-sm font-bold text-[#1A1A1A]">Carregando Vitrine Oficial Viva Tec...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col pb-16">
      {/* Banner Principal do Festival Viva Tec */}
      <section className="relative bg-gradient-to-br from-[#1A1A1A] via-[#2A1525] to-[#E11D74] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#E11D74] overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E11D74]/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-pink-400/20 blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E11D74]/30 border border-[#E11D74]/60 text-pink-200 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" /> Festival de Heróis Fictícios •
              Senac & Sesc
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <VivaTecLogo iconSize="lg" showTagline={false} onlyIcon={true} className="mt-1" />
              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  Vitrine de <span className="text-pink-300 drop-shadow-md">Vencedores</span>
                </h1>
                <p className="text-xs sm:text-sm text-pink-200 uppercase tracking-widest font-extrabold mt-0.5">
                  VIVA TEC • Próxima parada: Ensino Médio
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-pink-100 max-w-2xl font-medium">
              Apresentações Artísticas, Inovação e Impacto ESG dos estudantes protagonistas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setQrModalOpen(true)}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-2xl h-11 px-4 font-bold text-xs flex items-center gap-2 shadow-md backdrop-blur-sm"
            >
              <QrCode className="w-4 h-4 text-pink-300" />
              <span>QR Code para Comunidade</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ESTADO 1: AGUARDANDO RESULTADOS (PRD V2 - Vitrine fica em "Aguardando" até liberação admin) */}
      {eventStatus === 'waiting' ? (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8 flex-1 flex flex-col justify-center">
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#1A1A1A] flex items-center justify-center text-[#E11D74] shadow-2xl border-4 border-[#E11D74] animate-bounce">
            <Radio className="w-12 h-12 text-[#E11D74] animate-pulse" />
          </div>

          <div className="space-y-3">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-pink-100 text-[#E11D74] border border-pink-200 inline-block">
              Apuração Oficial em Andamento • Viva Tec
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">
              Aguardando Publicação da Banca
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              Os jurados da banca examinadora e a comissão Senac/Sesc estão consolidando as notas
              dos 7 critérios e aplicando eventuais penalidades. O pódio será liberado ao vivo aqui
              nos telões!
            </p>
          </div>

          {/* Cards das Startups em Apresentação com Estudantes */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Startups & Heróis Fictícios da Noite ({startups.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {startups.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-left hover:border-[#E11D74]/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Herói Fictício
                    </span>
                    {getPillarBadge(s.esg_pillar)}
                  </div>
                  <h4 className="font-black text-[#1A1A1A] text-base truncate">{s.hero_name}</h4>
                  <p className="text-xs text-[#E11D74] font-bold truncate">{s.name}</p>
                  {s.estudantes && (
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                      👥 {s.estudantes}
                    </p>
                  )}
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

          {/* PÓDIO HEROICO VIVA TEC (1º, 2º e 3º Lugares com animação e rosa vibrante) */}
          {ranking.length > 0 && (
            <section className="space-y-6">
              <div className="text-center space-y-2 flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-200">
                  <VivaTecLogo iconSize="sm" showTagline={false} onlyIcon={true} />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E11D74]">
                    Próxima parada: Ensino Médio
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight">
                  Pódio dos Campeões Viva Tec
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
                  Destaque para as startups, estudantes protagonistas e os heróis fictícios mais bem
                  avaliados pela banca
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
                {/* 2º LUGAR (Prata) */}
                {top2 && (
                  <div className="order-2 md:order-1 podium-2">
                    <Card
                      onClick={() => setSelectedRankResult(top2)}
                      className="cursor-pointer group relative overflow-hidden bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                      <div className="absolute top-0 right-0 left-0 h-3 bg-slate-300" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-800 font-black text-lg flex items-center justify-center border border-slate-300 shadow-sm">
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
                      <h3 className="text-xl font-black text-[#1A1A1A] group-hover:text-[#E11D74] transition-colors truncate">
                        {top2.startup.hero_name}
                      </h3>
                      <p className="text-xs font-bold text-slate-700">{top2.startup.name}</p>

                      {/* Estudantes */}
                      {top2.startup.estudantes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 mb-3 font-medium">
                          👥 {top2.startup.estudantes}
                        </p>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Média Final:</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#1A1A1A]">
                            {top2.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ 100</span>
                        </div>
                      </div>

                      {top2.tieBreakerReason && (
                        <div className="mt-2 text-[10px] font-bold text-pink-700 bg-pink-50 p-1.5 rounded-lg border border-pink-200 text-center">
                          ★ {top2.tieBreakerReason}
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {/* 1º LUGAR (Ouro / Destaque Magenta Viva Tec) */}
                {top1 && (
                  <div className="order-1 md:order-2 podium-1">
                    <Card
                      onClick={() => setSelectedRankResult(top1)}
                      className="cursor-pointer group relative overflow-hidden bg-gradient-to-b from-pink-50/60 via-white to-white border-4 border-[#E11D74] rounded-3xl p-7 shadow-2xl hover:shadow-[0_20px_50px_rgba(225,29,116,0.3)] transition-all hover:-translate-y-2 glow-magenta"
                    >
                      <div className="absolute top-0 right-0 left-0 h-4 bg-[#E11D74]" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-14 h-14 rounded-2xl bg-[#E11D74] text-white font-black text-2xl flex items-center justify-center border-2 border-pink-300 shadow-md">
                          <Crown className="w-8 h-8 text-white" />
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E11D74] text-white shadow-xs">
                            1º Grande Campeão
                          </span>
                          {getPillarBadge(top1.startup.esg_pillar)}
                        </div>
                      </div>

                      {/* Capa */}
                      {top1.startup.cover_image && (
                        <div className="h-36 w-full rounded-2xl overflow-hidden mb-3 bg-pink-50 shadow-inner">
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

                      <span className="text-xs font-extrabold text-[#E11D74] uppercase tracking-widest block">
                        Herói Fictício Vencedor
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tight truncate">
                        {top1.startup.hero_name}
                      </h3>
                      <p className="text-sm font-bold text-slate-800">{top1.startup.name}</p>

                      {/* Estudantes do 1º Lugar */}
                      {top1.startup.estudantes && (
                        <div className="mt-1 p-2 bg-pink-50/80 rounded-xl border border-pink-100">
                          <span className="text-[10px] font-bold text-[#E11D74] uppercase block">
                            Estudantes Protagonistas:
                          </span>
                          <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                            {top1.startup.estudantes}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-2 my-3 font-medium italic">
                        "{top1.startup.synopsis}"
                      </p>

                      <div className="pt-3 border-t-2 border-pink-200 flex items-baseline justify-between bg-pink-50/40 p-3 rounded-2xl">
                        <span className="text-xs font-bold text-[#1A1A1A]">Nota Final Campeã:</span>
                        <div className="text-right">
                          <span className="text-3xl font-black text-[#E11D74]">
                            {top1.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-bold">pontos</span>
                        </div>
                      </div>

                      {top1.tieBreakerReason && (
                        <div className="mt-3 text-xs font-bold text-[#E11D74] bg-pink-100 p-2 rounded-xl border border-pink-200 text-center">
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
                      className="cursor-pointer group relative overflow-hidden bg-white border-2 border-amber-600/30 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all hover:-translate-y-1"
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
                      <h3 className="text-xl font-black text-[#1A1A1A] group-hover:text-[#E11D74] transition-colors truncate">
                        {top3.startup.hero_name}
                      </h3>
                      <p className="text-xs font-bold text-slate-700">{top3.startup.name}</p>

                      {/* Estudantes */}
                      {top3.startup.estudantes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 mb-3 font-medium">
                          👥 {top3.startup.estudantes}
                        </p>
                      )}

                      <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Média Final:</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#1A1A1A]">
                            {top3.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/ 100</span>
                        </div>
                      </div>

                      {top3.tieBreakerReason && (
                        <div className="mt-2 text-[10px] font-bold text-pink-700 bg-pink-50 p-1.5 rounded-lg border border-pink-200 text-center">
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
                <h3 className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#E11D74]" />
                  Classificação Geral de Todas as Startups
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Clique em qualquer startup para visualizar estudantes, pilar ESG, sinopse e
                  detalhes dos pareceres
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
                    <th className="py-3.5 px-4">Estudantes</th>
                    <th className="py-3.5 px-4">Pilar ESG</th>
                    <th className="py-3.5 px-4 text-center hidden md:table-cell">Avaliadores</th>
                    <th className="py-3.5 px-4 text-center hidden lg:table-cell">ESG / Criat.</th>
                    <th className="py-3.5 px-4 text-center hidden sm:table-cell">Penalidades</th>
                    <th className="py-3.5 px-4 text-right font-black text-[#1A1A1A]">Nota Final</th>
                    <th className="py-3.5 px-4 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranking.map((item) => (
                    <tr
                      key={item.startup.id}
                      onClick={() => setSelectedRankResult(item)}
                      className="hover:bg-pink-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Posição */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                            item.rank === 1
                              ? 'bg-[#E11D74] text-white font-black'
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
                          <div className="w-9 h-9 rounded-xl bg-pink-100 text-[#E11D74] flex items-center justify-center font-black text-xs flex-shrink-0">
                            {item.startup.hero_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[#1A1A1A] text-sm group-hover:text-[#E11D74] flex items-center gap-2">
                              <span>{item.startup.hero_name}</span>
                              {item.tieBreakerReason && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 bg-pink-100 text-pink-900 border-pink-200"
                                >
                                  Desempate: {item.tieBreakerReason}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-semibold">
                              {item.startup.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Estudantes */}
                      <td className="py-4 px-4">
                        <span
                          className="text-xs text-slate-600 line-clamp-1 max-w-[200px] font-medium"
                          title={item.startup.estudantes}
                        >
                          {item.startup.estudantes || '—'}
                        </span>
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
                        <span className="text-[#E11D74] font-bold">{item.avgCriatividade}</span>
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
                      <td className="py-4 px-4 text-right font-black text-base text-[#E11D74]">
                        {item.finalScore.toFixed(2)}
                      </td>

                      {/* Ação */}
                      <td className="py-4 px-4 text-center">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#E11D74] transition-transform group-hover:translate-x-1" />
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
