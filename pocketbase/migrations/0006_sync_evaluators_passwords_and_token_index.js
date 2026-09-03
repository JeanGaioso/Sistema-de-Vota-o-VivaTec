migrate(
  (app) => {
    // 1. Atualizar senhas de todos os avaliadores existentes para garantir que coincidam com Vivatec@2026
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const evaluators = app.findRecordsByFilter('_pb_users_auth_', 'role = "evaluator"', '', 0, 0)

    for (let i = 0; i < evaluators.length; i++) {
      const ev = evaluators[i]
      ev.setPassword('Vivatec@2026')
      ev.setVerified(true)
      ev.set('is_active', true)
      app.save(ev)
    }

    // 2. Adicionar índice único para quick_token para evitar colisões
    try {
      usersCol.addIndex('idx_users_quick_token', false, 'quick_token', '')
      app.save(usersCol)
    } catch (e) {
      console.warn('Índice quick_token já existente ou falhou:', e)
    }
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      usersCol.removeIndex('idx_users_quick_token')
      app.save(usersCol)
    } catch (_) {}
  },
)
