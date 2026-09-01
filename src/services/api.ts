import pb from '@/lib/pocketbase/client'
import { Startup, Evaluation, Setting, AuditLog } from '@/types'

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
      return await pb.collection('audit_logs').create<AuditLog>({
        action,
        details: details || '',
        user_email: user?.email || 'público / anônimo',
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
