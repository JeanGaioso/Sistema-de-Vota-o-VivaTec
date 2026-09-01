export type ESGPillar = 'Ambiental' | 'Social' | 'Governança'

export interface Startup {
  id: string
  name: string
  hero_name: string
  esg_pillar: ESGPillar
  synopsis: string
  cover_image?: string
  time_penalty: number
  order?: number
  created?: string
  updated?: string
}

export interface EvaluationCriteria {
  score_criatividade: number // Max 20
  score_figurino: number // Max 15
  score_esg: number // Max 20
  score_narrativa: number // Max 15
  score_engajamento: number // Max 15
  score_briefing: number // Max 10
  score_gestao_tempo: number // Max 5
}

export interface Evaluation extends EvaluationCriteria {
  id: string
  startup: string
  evaluator: string
  feedback?: string
  is_finalized?: boolean
  created?: string
  updated?: string
  expand?: {
    startup?: Startup
    evaluator?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface Setting {
  id: string
  key: string
  value: string
  created?: string
  updated?: string
}

export interface AuditLog {
  id: string
  action: string
  details?: string
  user_email?: string
  startup_name?: string
  created?: string
  updated?: string
}

export interface CriteriaConfig {
  key: keyof EvaluationCriteria
  label: string
  max: number
  description: string
  priorityOrder?: number // Para desempate: 1 = ESG, 2 = Criatividade, 3 = Engajamento
}

export const EVALUATION_CRITERIA: CriteriaConfig[] = [
  {
    key: 'score_esg',
    label: 'ESG & Sustentabilidade',
    max: 20,
    description: 'Coerência com o pilar ambiental, social ou de governança e impacto da proposta.',
    priorityOrder: 1,
  },
  {
    key: 'score_criatividade',
    label: 'Criatividade & Inovação',
    max: 20,
    description: 'Originalidade da proposta, conceitos do herói e solução artística.',
    priorityOrder: 2,
  },
  {
    key: 'score_engajamento',
    label: 'Engajamento & Presença de Palco',
    max: 15,
    description: 'Domínio de cena, conexão com o público e expressividade.',
    priorityOrder: 3,
  },
  {
    key: 'score_figurino',
    label: 'Figurino & Caracterização',
    max: 15,
    description: 'Qualidade estética e fidelidade do traje e maquiagem do herói fictício.',
  },
  {
    key: 'score_narrativa',
    label: 'Estrutura Narrativa',
    max: 15,
    description: 'Jornada do herói, começo, clímax, resolução e mensagem transmitida.',
  },
  {
    key: 'score_briefing',
    label: 'Briefing & Alinhamento',
    max: 10,
    description: 'Conformidade com os temas e orientações do Festival Sesc.',
  },
  {
    key: 'score_gestao_tempo',
    label: 'Gestão de Tempo',
    max: 5,
    description: 'Cumprimento pontual do tempo de palco da apresentação.',
  },
]

export interface StartupRankResult {
  startup: Startup
  evaluationsCount: number
  avgTotalEvaluators: number // Média da soma dos jurados
  avgCriatividade: number
  avgFigurino: number
  avgESG: number
  avgNarrativa: number
  avgEngajamento: number
  avgBriefing: number
  avgGestaoTempo: number
  timePenalty: number
  finalScore: number // (avgTotalEvaluators - timePenalty)
  rank: number
  tied: boolean
  tieBreakerReason?: string
  feedbacks: string[]
}
