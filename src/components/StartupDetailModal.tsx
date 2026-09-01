import React, { useState } from 'react'
import { StartupRankResult } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getFileUrl } from '@/lib/ranking'
import {
  Trophy,
  Leaf,
  Users,
  Building,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

interface StartupDetailModalProps {
  rankResult: StartupRankResult | null
  isOpen: boolean
  onClose: () => void
}

export function StartupDetailModal({ rankResult, isOpen, onClose }: StartupDetailModalProps) {
  if (!rankResult) return null

  const {
    startup,
    finalScore,
    avgTotalEvaluators,
    timePenalty,
    evaluationsCount,
    tied,
    tieBreakerReason,
    feedbacks,
  } = rankResult

  const getPillarIcon = (pillar: string) => {
    switch (pillar) {
      case 'Ambiental':
        return <Leaf className="w-4 h-4 text-emerald-600" />
      case 'Social':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'Governança':
        return <Building className="w-4 h-4 text-amber-600" />
      default:
        return <Sparkles className="w-4 h-4 text-[#1A237E]" />
    }
  }

  const getPillarBadgeColor = (pillar: string) => {
    switch (pillar) {
      case 'Ambiental':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'Social':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Governança':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300'
    }
  }

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-[#FFD600] text-[#1A237E] border-amber-400'
    if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300'
    if (rank === 3) return 'bg-amber-600 text-white border-amber-700'
    return 'bg-[#1A237E]/10 text-[#1A237E] border-[#1A237E]/20'
  }

  const coverUrl = getFileUrl('startups', startup.id, startup.cover_image)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 bg-white rounded-3xl border-2 border-slate-200 shadow-2xl">
        {/* Header Visual com Capa ou Gradiente */}
        <div className="relative h-48 bg-gradient-to-br from-[#1A237E] via-[#283593] to-[#0D47A1] overflow-hidden flex items-end p-6">
          {coverUrl && (
            <img
              src={coverUrl}
              alt={startup.name}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
            />
          )}

          {/* Posicionador de Rank */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md flex items-center gap-1.5 ${getMedalColor(
                rankResult.rank,
              )}`}
            >
              <Trophy className="w-3.5 h-3.5" />
              {rankResult.rank}º Lugar Geral
            </span>
          </div>

          <div className="relative z-10 text-white">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FFD600] drop-shadow-sm flex items-center gap-1">
              <Award className="w-3.5 h-3.5 inline" /> Herói Fictício
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
              {startup.hero_name}
            </h2>
            <p className="text-sm font-semibold text-blue-100">
              Startup Criadora: <strong className="text-white">{startup.name}</strong>
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pilar ESG e Nota Destaque */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pilar ESG:
              </span>
              <Badge
                variant="outline"
                className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 ${getPillarBadgeColor(
                  startup.esg_pillar,
                )}`}
              >
                {getPillarIcon(startup.esg_pillar)}
                {startup.esg_pillar}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-slate-500">Nota Final Apurada:</span>
              <span className="text-3xl font-black text-[#1A237E]">{finalScore.toFixed(2)}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Desempate Badge se houver */}
          {tieBreakerReason && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Critério de Desempate Aplicado:</strong> {tieBreakerReason} conforme
                regulamento oficial.
              </span>
            </div>
          )}

          {/* Sinopse da Jornada do Herói */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Sinopse da Jornada do Herói & Proposta
            </h3>
            <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl text-sm leading-relaxed text-slate-700 font-medium">
              {startup.synopsis || 'Sem sinopse cadastrada para este herói.'}
            </div>
          </div>

          {/* Médias por Critério (PRD 7 Critérios) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Desempenho por Critério de Avaliação
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  ESG & Sustent.
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-emerald-700">{rankResult.avgESG}</span>
                  <span className="text-[10px] text-slate-400">/ 20</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Criatividade</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-indigo-700">
                    {rankResult.avgCriatividade}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 20</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Engajamento</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-amber-700">
                    {rankResult.avgEngajamento}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 15</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Figurino</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-purple-700">
                    {rankResult.avgFigurino}
                  </span>
                  <span className="text-[10px] text-slate-400">/ 15</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Narrativa</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-blue-700">{rankResult.avgNarrativa}</span>
                  <span className="text-[10px] text-slate-400">/ 15</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Briefing & Alinh.
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-slate-700">{rankResult.avgBriefing}</span>
                  <span className="text-[10px] text-slate-400">/ 10</span>
                </div>
              </div>
            </div>

            {/* Subtração de Penalidades */}
            {timePenalty > 0 && (
              <div className="mt-3 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Penalidade por tempo excedente aplicada pela comissão:
                </span>
                <span className="font-bold text-red-800">-{timePenalty} pts</span>
              </div>
            )}
          </div>

          {/* Feedbacks da Banca */}
          {feedbacks && feedbacks.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Parecer & Comentários da Banca ({feedbacks.length})
              </h3>
              <div className="space-y-2">
                {feedbacks.map((fb, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 italic"
                  >
                    "{fb}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
