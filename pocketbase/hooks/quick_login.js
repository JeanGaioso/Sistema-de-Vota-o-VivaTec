routerAdd('POST', '/backend/v1/quick-login', (e) => {
  const body = e.requestInfo().body || {}
  const input = (body.token || body.email || '').toString().trim()

  if (!input) {
    return e.json(400, { message: 'Token ou e-mail não informado.' })
  }

  // 1. Tentar localizar usuário
  let userRecord = null

  // Se contém '@', tenta por email
  if (input.includes('@')) {
    try {
      userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', input.toLowerCase())
    } catch (_) {}
  }

  // Se ainda não achou, busca por quick_token (case-insensitive ou exato)
  if (!userRecord) {
    const cleanLower = input.toLowerCase()
    const found = $app.findRecordsByFilter(
      '_pb_users_auth_',
      'quick_token = {:token} || quick_token = {:lower}',
      '-created',
      1,
      0,
      { token: input, lower: cleanLower },
    )
    if (found && found.length > 0) {
      userRecord = found[0]
    }
  }

  // Se ainda não achou, mapeamento legado para tokens conhecidos
  if (!userRecord) {
    const tokenMap = {
      admin: 'jeangaioso@gmail.com',
      'sesc-admin': 'jeangaioso@gmail.com',
      evaluator1: 'evaluator1@sesc.com',
      eval1: 'evaluator1@sesc.com',
      banca1: 'evaluator1@sesc.com',
      evaluator2: 'evaluator2@sesc.com',
      eval2: 'evaluator2@sesc.com',
      banca2: 'evaluator2@sesc.com',
      tec3: 'profmauro@vivatec.com.br',
      org1: 'organizador@sesc.com',
    }
    const mappedEmail = tokenMap[input.toLowerCase()]
    if (mappedEmail) {
      try {
        userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', mappedEmail)
      } catch (_) {}
    }
  }

  if (!userRecord) {
    return e.json(404, { message: 'Credencial de acesso não encontrada para o token fornecido.' })
  }

  // Verificar se o usuário está ativo
  if (userRecord.get('is_active') === false) {
    return e.json(403, { message: 'Acesso negado: usuário desativado pela comissão organizadora.' })
  }

  // Gerar token de autenticação oficial do PocketBase para o registro (v0.23+ usa record.newAuthToken())
  const authToken = userRecord.newAuthToken()

  return e.json(200, {
    token: authToken,
    record: {
      id: userRecord.id,
      email: userRecord.email(),
      name: userRecord.get('name') || '',
      role: userRecord.get('role') || 'evaluator',
      is_evaluator: userRecord.get('is_evaluator') === true,
      avatar: userRecord.get('avatar') || '',
      is_active: userRecord.get('is_active') !== false,
      quick_token: userRecord.get('quick_token') || '',
    },
  })
})
