import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

// Mapeamento amigável para mensagens de validação do PocketBase em português
function translateFieldError(field: string, rawMessage: string, code?: string): string {
  const isUnique =
    code === 'validation_not_unique' ||
    /must be unique|already in use|já existe|já está em uso/i.test(rawMessage)

  if (isUnique) {
    switch (field.toLowerCase()) {
      case 'email':
        return 'Este e-mail já está cadastrado por outro usuário no sistema.'
      case 'username':
        return 'Este nome de usuário já está em uso.'
      case 'quick_token':
        return 'Este código de acesso rápido já está em uso por outro usuário.'
      default:
        return `O campo "${field}" já está em uso e precisa ser único.`
    }
  }

  const isRequired =
    code === 'validation_required' || /cannot be blank|is required|obrigatório/i.test(rawMessage)

  if (isRequired) {
    switch (field.toLowerCase()) {
      case 'email':
        return 'O e-mail é obrigatório.'
      case 'password':
        return 'A senha é obrigatória.'
      case 'name':
        return 'O nome é obrigatório.'
      default:
        return `O campo "${field}" é obrigatório.`
    }
  }

  if (field === 'password' && /min|short|characters/i.test(rawMessage)) {
    return 'A senha deve conter no mínimo 8 caracteres.'
  }

  return rawMessage
}

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      const code = (detail as { code?: string }).code
      const rawMessage = (detail as { message: string }).message
      errors[field] = translateFieldError(field, rawMessage, code)
    } else if (typeof detail === 'string') {
      errors[field] = translateFieldError(field, detail)
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) {
    return msgs.join(' ')
  }
  const rawMsg = error.message || ''
  if (/Value must be unique/i.test(rawMsg)) {
    return 'Um dos valores informados já está cadastrado por outro usuário (e-mail ou código de acesso).'
  }
  return rawMsg || 'Ocorreu um erro inesperado ao processar a requisição.'
}
