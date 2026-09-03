import pb from '@/lib/pocketbase/client'
import { Startup, Evaluation, Setting, AuditLog, EvaluatorUser } from '@/types'

export const evaluatorsService = {
  // Retorna avaliadores: jurados puros ou membros da comissão com is_evaluator === true
  async getAll(): Promise<EvaluatorUser[]> {
    return await pb.collection('users').getFullList<EvaluatorUser>({
      filter: 'role = "evaluator" || is_evaluator = true',
      sort: 'name',
    })
  },

  // Retorna especificamente jurados da banca
  async getBancaJurados(): Promise<EvaluatorUser[]> {
    return await pb.collection('users').getFullList<EvaluatorUser>({
      filter: 'role = "evaluator" || (role = "organizer" && is_evaluator = true)',
      sort: 'name',
    })
  },

  // Retorna organizadores da comissão
  async getOrganizers(): Promise<EvaluatorUser[]> {
    return await pb.collection('users').getFullList<EvaluatorUser>({
      filter: 'role = "organizer" || role = "admin"',
      sort: 'name',
    })
  },

  async getAllUsers(): Promise<EvaluatorUser[]> {
    return await pb.collection('users').getFullList<EvaluatorUser>({
      sort: 'role,name',
    })
  },

  async getById(id: string): Promise<EvaluatorUser> {
    return await pb.collection('users').getOne<EvaluatorUser>(id)
  },

  async create(data: {
    name: string
    email: string
    password?: string
    quick_token?: string
    role?: 'admin' | 'organizer' | 'evaluator'
    is_evaluator?: boolean
  }): Promise<EvaluatorUser> {
    const passwordToUse =
      data.password && data.password.trim().length >= 8 ? data.password.trim() : 'Vivatec@2026'
    const roleToUse = data.role || 'evaluator'
    const prefix = roleToUse === 'organizer' ? 'org' : 'eval'
    const token =
      data.quick_token?.trim() ||
      data.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') ||
      `${prefix}${Math.floor(Math.random() * 9000 + 1000)}`

    // Se evaluator, is_evaluator é true por padrão. Se organizer, respeita o recebido ou false
    const isEval = data.is_evaluator !== undefined ? data.is_evaluator : roleToUse === 'evaluator'

    const userRecord = await pb.collection('users').create<EvaluatorUser>({
      email: data.email.trim(),
      password: passwordToUse,
      passwordConfirm: passwordToUse,
      name: data.name.trim(),
      role: roleToUse,
      is_active: true,
      is_evaluator: isEval,
      quick_token: token,
      emailVisibility: false,
    })

    return userRecord
  },

  async update(
    id: string,
    data: {
      name?: string
      email?: string
      is_active?: boolean
      is_evaluator?: boolean
      role?: 'admin' | 'organizer' | 'evaluator'
      quick_token?: string
      password?: string
    },
  ): Promise<EvaluatorUser> {
    const payload: Record<string, any> = {}
    if (data.name !== undefined) payload.name = data.name.trim()
    if (data.email !== undefined) payload.email = data.email.trim()
    if (data.is_active !== undefined) payload.is_active = data.is_active
    if (data.is_evaluator !== undefined) payload.is_evaluator = data.is_evaluator
    if (data.role !== undefined) payload.role = data.role
    if (data.quick_token !== undefined) payload.quick_token = data.quick_token.trim()
    if (data.password && data.password.trim().length >= 8) {
      payload.password = data.password.trim()
      payload.passwordConfirm = data.password.trim()
    }
    return await pb.collection('users').update<EvaluatorUser>(id, payload)
  },

  async toggleActive(id: string, currentState: boolean): Promise<EvaluatorUser> {
    return await pb.collection('users').update<EvaluatorUser>(id, {
      is_active: !currentState,
    })
  },

  async toggleEvaluatorRole(id: string, currentEvaluatorState: boolean): Promise<EvaluatorUser> {
    return await pb.collection('users').update<EvaluatorUser>(id, {
      is_evaluator: !currentEvaluatorState,
    })
  },

  async resetPassword(id: string, newPassword = 'Vivatec@2026'): Promise<EvaluatorUser> {
    return await pb.collection('users').update<EvaluatorUser>(id, {
      password: newPassword,
      passwordConfirm: newPassword,
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('users').delete(id)
  },
}

export const startupsService = {
  async getAll(): Promise<Startup[]> {
    return await pb.collection('startups').getFullList<Startup>({
      sort: 'order,name',
    })
  },

  async getById(id: string): Promise<Startup> {
    return await pb.collection('startups').getOne<Startup>(id)
  },

  async create(data: FormData | Partial<Startup>): Promise<Startup> {
    return await pb.collection('startups').create<Startup>(data)
  },

  async update(id: string, data: FormData | Partial<Startup>): Promise<Startup> {
    return await pb.collection('startups').update<Startup>(id, data)
  },

  async updatePenalty(id: string, penalty: number): Promise<Startup> {
    return await pb.collection('startups').update<Startup>(id, {
      time_penalty: penalty,
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('startups').delete(id)
  },
}

export const evaluationsService = {
  async getAll(): Promise<Evaluation[]> {
    return await pb.collection('evaluations').getFullList<Evaluation>({
      expand: 'startup,evaluator',
      sort: '-updated',
    })
  },

  async getByEvaluator(evaluatorId: string): Promise<Evaluation[]> {
    return await pb.collection('evaluations').getFullList<Evaluation>({
      filter: `evaluator = "${evaluatorId}"`,
      expand: 'startup',
    })
  },

  async getByStartupAndEvaluator(
    startupId: string,
    evaluatorId: string,
  ): Promise<Evaluation | null> {
    try {
      const records = await pb.collection('evaluations').getFullList<Evaluation>({
        filter: `startup = "${startupId}" && evaluator = "${evaluatorId}"`,
      })
      return records[0] || null
    } catch {
      return null
    }
  },

  async saveEvaluation(data: Partial<Evaluation>): Promise<Evaluation> {
    if (data.id) {
      return await pb.collection('evaluations').update<Evaluation>(data.id, data)
    }

    // Checar se já existe antes de criar
    if (data.startup && data.evaluator) {
      const existing = await this.getByStartupAndEvaluator(data.startup, data.evaluator)
      if (existing) {
        return await pb.collection('evaluations').update<Evaluation>(existing.id, data)
      }
    }

    return await pb.collection('evaluations').create<Evaluation>(data)
  },

  async unlockEvaluation(id: string): Promise<Evaluation> {
    return await pb.collection('evaluations').update<Evaluation>(id, {
      is_finalized: false,
    })
  },
}

export const settingsService = {
  async getStatus(): Promise<'waiting' | 'published'> {
    try {
      const record = await pb
        .collection('settings')
        .getFirstListItem<Setting>('key = "event_status"')
      return (record.value as 'waiting' | 'published') || 'waiting'
    } catch {
      return 'waiting'
    }
  },

  async setStatus(status: 'waiting' | 'published'): Promise<Setting> {
    try {
      const record = await pb
        .collection('settings')
        .getFirstListItem<Setting>('key = "event_status"')
      return await pb.collection('settings').update<Setting>(record.id, { value: status })
    } catch {
      return await pb.collection('settings').create<Setting>({ key: 'event_status', value: status })
    }
  },

  async getAll(): Promise<Setting[]> {
    return await pb.collection('settings').getFullList<Setting>()
  },
}

export const auditLogsService = {
  async log(action: string, details?: string, startupName?: string): Promise<AuditLog | null> {
    try {
      const user = pb.authStore.record
      const email = user?.email || (pb.authStore.model as any)?.email || 'público / anônimo'
      return await pb.collection('audit_logs').create<AuditLog>({
        action,
        details: details || '',
        user_email: email,
        startup_name: startupName || '',
      })
    } catch (e) {
      console.warn('Erro ao salvar log de auditoria:', e)
      return null
    }
  },

  async getAll(): Promise<AuditLog[]> {
    return await pb.collection('audit_logs').getFullList<AuditLog>({
      sort: '-created',
    })
  },
}
