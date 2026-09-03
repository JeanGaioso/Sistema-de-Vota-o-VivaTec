migrate(
  (app) => {
    // Atualizar senha dos avaliadores existentes para Vivatec@2026
    const evaluatorEmails = ['evaluator1@sesc.com', 'evaluator2@sesc.com']

    for (let i = 0; i < evaluatorEmails.length; i++) {
      const email = evaluatorEmails[i]
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        user.setPassword('Vivatec@2026')
        user.setVerified(true)
        user.set('is_active', true)
        app.save(user)
      } catch (err) {
        console.warn(`[migration 0005] Não foi possível atualizar usuário ${email}:`, err)
      }
    }
  },
  (app) => {
    // Reverter para a senha anterior caso necessário
    const evaluatorEmails = ['evaluator1@sesc.com', 'evaluator2@sesc.com']

    for (let i = 0; i < evaluatorEmails.length; i++) {
      const email = evaluatorEmails[i]
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        user.setPassword('Skip@Pass')
        app.save(user)
      } catch (_) {}
    }
  },
)
