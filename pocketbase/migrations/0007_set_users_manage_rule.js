migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Permitir que administradores ou coordenadores autenticados gerenciem os usuários
    // (inclusive alterando senha sem precisar da senha antiga, e ignorando emailVisibility)
    users.manageRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.manageRule = null
    app.save(users)
  },
)
