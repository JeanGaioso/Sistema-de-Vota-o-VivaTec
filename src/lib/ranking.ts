import { Startup, Evaluation, StartupRankResult } from '@/types'

/**
 * Motor de cálculo de notas e ranking oficial do Festival Sesc:
 * 1. Soma das notas dos 7 critérios para cada avaliação individual (0-100).
 * 2. Média aritmética das somas dos avaliadores para cada startup.
 * 3. Subtração de penalidades de tempo/conduta: Nota Final = (Média Avaliadores) - Penalidade.
 * 4. Desempate rigoroso conforme Regra de Negócio 2 do PRD:
 *    1º Critério de desempate: Maior nota média em ESG
 *    2º Critério de desempate: Maior nota média em Criatividade
 *    3º Critério de desempate: Maior nota média em Engajamento
 */
export function calculateRanking(
  startups: Startup[],
  evaluations: Evaluation[],
): StartupRankResult[] {
  const mapStartupEvaluations = new Map<string, Evaluation[]>()

  startups.forEach((s) => {
    mapStartupEvaluations.set(s.id, [])
  })

  evaluations.forEach((e) => {
    // Apenas avaliações finalizadas ou com notas computáveis
    const list = mapStartupEvaluations.get(e.startup)
    if (list) {
      list.push(e)
    }
  })

  const rawResults: Omit<StartupRankResult, 'rank' | 'tied' | 'tieBreakerReason'>[] = []

  startups.forEach((startup) => {
    const evals = mapStartupEvaluations.get(startup.id) || []
    const count = evals.length

    let sumTotal = 0
    let sumCriatividade = 0
    let sumFigurino = 0
    let sumESG = 0
    let sumNarrativa = 0
    let sumEngajamento = 0
    let sumBriefing = 0
    let sumGestaoTempo = 0
    const feedbacks: string[] = []

    evals.forEach((ev) => {
      const singleTotal =
        (ev.score_criatividade || 0) +
        (ev.score_figurino || 0) +
        (ev.score_esg || 0) +
        (ev.score_narrativa || 0) +
        (ev.score_engajamento || 0) +
        (ev.score_briefing || 0) +
        (ev.score_gestao_tempo || 0)

      sumTotal += singleTotal
      sumCriatividade += ev.score_criatividade || 0
      sumFigurino += ev.score_figurino || 0
      sumESG += ev.score_esg || 0
      sumNarrativa += ev.score_narrativa || 0
      sumEngajamento += ev.score_engajamento || 0
      sumBriefing += ev.score_briefing || 0
      sumGestaoTempo += ev.score_gestao_tempo || 0

      if (ev.feedback && ev.feedback.trim()) {
        feedbacks.push(ev.feedback.trim())
      }
    })

    const avgTotalEvaluators = count > 0 ? Number((sumTotal / count).toFixed(2)) : 0
    const avgCriatividade = count > 0 ? Number((sumCriatividade / count).toFixed(2)) : 0
    const avgFigurino = count > 0 ? Number((sumFigurino / count).toFixed(2)) : 0
    const avgESG = count > 0 ? Number((sumESG / count).toFixed(2)) : 0
    const avgNarrativa = count > 0 ? Number((sumNarrativa / count).toFixed(2)) : 0
    const avgEngajamento = count > 0 ? Number((sumEngajamento / count).toFixed(2)) : 0
    const avgBriefing = count > 0 ? Number((sumBriefing / count).toFixed(2)) : 0
    const avgGestaoTempo = count > 0 ? Number((sumGestaoTempo / count).toFixed(2)) : 0

    const penalty = startup.time_penalty || 0
    const finalScore = Number(Math.max(0, avgTotalEvaluators - penalty).toFixed(2))

    rawResults.push({
      startup,
      evaluationsCount: count,
      avgTotalEvaluators,
      avgCriatividade,
      avgFigurino,
      avgESG,
      avgNarrativa,
      avgEngajamento,
      avgBriefing,
      avgGestaoTempo,
      timePenalty: penalty,
      finalScore,
      feedbacks,
    })
  })

  // Ordenação com desempate
  rawResults.sort((a, b) => {
    // 1. Maior nota final
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore
    }
    // 2. Desempate 1: ESG
    if (b.avgESG !== a.avgESG) {
      return b.avgESG - a.avgESG
    }
    // 3. Desempate 2: Criatividade
    if (b.avgCriatividade !== a.avgCriatividade) {
      return b.avgCriatividade - a.avgCriatividade
    }
    // 4. Desempate 3: Engajamento
    if (b.avgEngajamento !== a.avgEngajamento) {
      return b.avgEngajamento - a.avgEngajamento
    }
    // Caso continue empatado
    return a.startup.name.localeCompare(b.startup.name)
  })

  // Atribuição de posição no ranking e verificação de critérios de desempate aplicados
  const results: StartupRankResult[] = rawResults.map((item, idx) => {
    return {
      ...item,
      rank: idx + 1,
      tied: false,
      tieBreakerReason: undefined,
    }
  })

  // Identificar se houve empate com o item anterior/posterior com a mesma nota final
  for (let i = 0; i < results.length; i++) {
    const current = results[i]
    const prev = results[i - 1]
    const next = results[i + 1]

    const hasSameScorePrev = prev && prev.finalScore === current.finalScore
    const hasSameScoreNext = next && next.finalScore === current.finalScore

    if (hasSameScorePrev || hasSameScoreNext) {
      current.tied = true
      if (prev && prev.finalScore === current.finalScore) {
        if (prev.avgESG > current.avgESG) {
          prev.tieBreakerReason = 'Vencedor por ESG'
        } else if (prev.avgCriatividade > current.avgCriatividade) {
          prev.tieBreakerReason = 'Vencedor por Criatividade'
        } else if (prev.avgEngajamento > current.avgEngajamento) {
          prev.tieBreakerReason = 'Vencedor por Engajamento'
        }
      }
    }
  }

  return results
}

export function getFileUrl(
  collectionName: string,
  recordId: string,
  filename?: string,
): string | null {
  if (!filename) return null
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  return `${baseUrl}/api/files/${collectionName}/${recordId}/${filename}`
}
