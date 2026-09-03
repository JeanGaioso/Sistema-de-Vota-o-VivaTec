import React, { useState } from 'react'
import { StartupRankResult } from '@/types'
import { generatePostEventPdfReport } from '@/lib/pdfReport'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Trophy,
  Users,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Leaf,
  Building,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface PostEventReportViewProps {
  ranking: StartupRankResult[]
  eventName?: string
  generatedBy?: string
}

export function PostEventReportView({
  ranking,
  eventName = 'Festival de Apresentação Artística de Heróis Fictícios • Viva Tec',
  generatedBy = 'Comissão Organizadora Viva Tec (Senac & Sesc)',
}: PostEventReportViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPillar, setSelectedPillar] = useState<
    'Todos' | 'Ambiental' | 'Social' | 'Governança'
  >('Todos')
  const [expandedStartups, setExpandedStartups] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedStartups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleExportPdf = () => {
    generatePostEventPdfReport({
      ranking,
      eventName,
      generatedBy,
    })
  }

  // Filtragem de startups
  const filteredRanking = ranking.filter((item) => {
    const matchesSearch =
      item.startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.startup.hero_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.startup.estudantes &&
        item.startup.estudantes.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesPillar = selectedPillar === 'Todos' || item.startup.esg_pillar === selectedPillar
    return matchesSearch && matchesPillar
  })

  // Total de observações qualitativas computadas
  const totalObservations = ranking.reduce(
    (acc, cur) => acc + (cur.qualitativeObservations?.length || 0),
    0,
  )

  return (
    <div className="space-y-6">
      {/* Banner de Ação e Exportação Oficial em PDF */}
      <div className="bg-gradient-to-r from-[#1A1A1A] via-[#701A75] to-[#E11D74] text-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-pink-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-[#E11D74]">
              Relatório Pós-Evento
            </span>
            <span className="text-xs text-pink-200">Próxima parada: Ensino Médio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Compilação Qualitativa por Startup
          </h2>
          <p className="text-xs sm:text-sm text-pink-100">
            Dossiê completo contendo a nota final oficial, posição no ranking, médias detalhadas dos
            7 critérios avaliativos e todos os pareceres descritivos enviados pelos jurados da
            banca.
          </p>
        </div>

        {/* Botão de Exportação de PDF Oficial */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handleExportPdf}
            className="h-13 px-6 bg-white hover:bg-pink-50 text-[#E11D74] font-black text-sm rounded-2xl shadow-2xl flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5 text-[#E11D74]" />
            <div className="text-left">
              <span className="block leading-tight">Exportar Relatório em PDF</span>
              <span className="text-[10px] text-slate-500 font-bold block">
                Visualização formatada para impressão A4
              </span>
            </div>
          </Button>
        </div>
      </div>

      {/* Métricas do Relatório */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border-2 border-slate-200 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Startups Ranqueadas
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#1A1A1A]">{ranking.length} equipes</span>
            <span className="text-xs text-slate-500">100% auditadas</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-2 border-slate-200 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Pareceres Qualitativos Coletados
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-[#E11D74]">
              {totalObservations} observações
            </span>
            <span className="text-xs text-slate-500">identificadas por jurado</span>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-2 border-slate-200 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Critérios Avaliativos
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700">7 Dimensões</span>
            <span className="text-xs text-slate-500">Desempate: ESG &gt; Criatividade</span>
          </div>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Buscar por startup, herói ou estudante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs border-slate-200"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Pilar:</span>
          {(['Todos', 'Ambiental', 'Social', 'Governança'] as const).map((pillar) => (
            <Button
              key={pillar}
              size="sm"
              variant={selectedPillar === pillar ? 'default' : 'outline'}
              onClick={() => setSelectedPillar(pillar)}
              className={`h-8 px-3 rounded-xl text-xs font-bold ${
                selectedPillar === pillar
                  ? 'bg-[#E11D74] text-white hover:bg-[#BE185D]'
                  : 'text-slate-700 hover:bg-pink-50'
              }`}
            >
              {pillar}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Startups com Observações Qualitativas Compiladas */}
      <div className="space-y-4">
        {filteredRanking.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-[#1A1A1A] text-base">Nenhuma startup encontrada</h3>
            <p className="text-xs text-slate-500">
              Tente ajustar seus termos de pesquisa ou filtros.
            </p>
          </div>
        ) : (
          filteredRanking.map((item) => {
            const obs = item.qualitativeObservations || []
            const isExpanded = expandedStartups[item.startup.id] !== false // Padrão aberto
            const rankBadgeColor =
              item.rank === 1
                ? 'bg-[#E11D74] text-white shadow-md'
                : item.rank === 2
                  ? 'bg-slate-200 text-slate-800'
                  : item.rank === 3
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-600'

            return (
              <Card
                key={item.startup.id}
                className="rounded-3xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Header da Startup */}
                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-black text-xs ${rankBadgeColor}`}
                      >
                        {item.rank}º Lugar
                      </span>
                      <h3 className="text-xl font-black text-[#1A1A1A]">
                        {item.startup.hero_name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-pink-300 bg-pink-50 text-[#E11D74] font-bold text-xs"
                      >
                        {item.startup.esg_pillar}
                      </Badge>
                      {item.tieBreakerReason && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-100 text-[#701A75] border border-pink-200">
                          ★ {item.tieBreakerReason}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-[#E11D74]">Startup: {item.startup.name}</p>

                    {item.startup.estudantes && (
                      <p className="text-xs text-slate-600 mt-1">
                        👥 <strong>Estudantes:</strong> {item.startup.estudantes}
                      </p>
                    )}
                  </div>

                  {/* Pontuação Consolidada */}
                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Nota Final Oficial
                      </span>
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-3xl font-black text-[#E11D74]">
                          {item.finalScore.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                      </div>
                      {item.timePenalty > 0 && (
                        <span className="text-[10px] text-red-600 font-bold block">
                          Penalidade: -{item.timePenalty} pts
                        </span>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(item.startup.id)}
                      className="rounded-xl h-9 px-2 text-slate-500 hover:text-[#1A1A1A]"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Médias por Critério (Os 7 Critérios Oficiais) */}
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                        Médias Oficiais por Critério Avaliativo
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                            ESG (1º)
                          </span>
                          <span className="text-lg font-black text-emerald-700 block mt-0.5">
                            {item.avgESG.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 20</span>
                        </div>

                        <div className="p-3 bg-pink-50/80 border border-pink-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-[#E11D74] uppercase block">
                            Criat. (2º)
                          </span>
                          <span className="text-lg font-black text-[#E11D74] block mt-0.5">
                            {item.avgCriatividade.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 20</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block">
                            Engaj. (3º)
                          </span>
                          <span className="text-lg font-black text-slate-800 block mt-0.5">
                            {item.avgEngajamento.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 15</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block">
                            Figurino
                          </span>
                          <span className="text-lg font-black text-slate-800 block mt-0.5">
                            {item.avgFigurino.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 15</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block">
                            Narrativa
                          </span>
                          <span className="text-lg font-black text-slate-800 block mt-0.5">
                            {item.avgNarrativa.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 15</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block">
                            Briefing
                          </span>
                          <span className="text-lg font-black text-slate-800 block mt-0.5">
                            {item.avgBriefing.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 10</span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-slate-600 uppercase block">
                            Gestão Tempo
                          </span>
                          <span className="text-lg font-black text-slate-800 block mt-0.5">
                            {item.avgGestaoTempo.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">/ 5</span>
                        </div>
                      </div>
                    </div>

                    {/* Observações Qualitativas dos Jurados */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#E11D74]" />
                          Pareceres e Observações Qualitativas da Banca ({obs.length})
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Identificado por jurado examinador
                        </span>
                      </div>

                      {obs.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500 italic">
                          Ainda não há observações qualitativas registradas para esta startup.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {obs.map((o, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-pink-50/40 border-2 border-pink-100/80 space-y-1.5 transition-colors hover:bg-pink-50/70"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#E11D74] text-white flex items-center justify-center font-bold text-[10px]">
                                    {o.evaluatorName.charAt(0).toUpperCase()}
                                  </div>
                                  <strong className="text-xs font-bold text-[#701A75]">
                                    {o.evaluatorName}
                                  </strong>
                                </div>
                                <span className="text-[11px] font-black text-[#E11D74] bg-white px-2 py-0.5 rounded-md border border-pink-200">
                                  Nota: {o.totalScore}/100
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 italic pl-8">"{o.feedback}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
