migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Atualizar valores permitidos do select 'role' para incluir 'organizer'
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'organizer', 'evaluator']
      roleField.maxSelect = 1
    } else {
      users.fields.add(
        new SelectField({
          name: 'role',
          type: 'select',
          required: false,
          values: ['admin', 'organizer', 'evaluator'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Adicionar campo 'is_evaluator' (bool) para ativar/desativar a condição de avaliador do organizador
    if (!users.fields.getByName('is_evaluator')) {
      users.fields.add(
        new BoolField({
          name: 'is_evaluator',
          type: 'bool',
          required: false,
        }),
      )
    }

    // 3. Atualizar manageRule para garantir que admins e organizadores possam gerenciar os usuários
    users.manageRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'organizer')"
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id != ''"
    users.updateRule = "@request.auth.id != ''"
    users.deleteRule = "@request.auth.id != ''"

    app.save(users)

    // 4. Inicializar is_evaluator = true para todos os usuários com role = 'evaluator' existentes
    try {
      const evaluators = app.findRecordsByFilter('_pb_users_auth_', 'role = "evaluator"', '', 0, 0)
      for (let i = 0; i < evaluators.length; i++) {
        const ev = evaluators[i]
        ev.set('is_evaluator', true)
        app.save(ev)
      }
    } catch (e) {
      console.warn('Erro ao atualizar is_evaluator em avaliadores existentes:', e)
    }

    // 5. Garantir que admin jeangaioso tenha is_evaluator = true
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'jeangaioso@gmail.com')
      admin.set('is_evaluator', true)
      app.save(admin)
    } catch (_) {}

    // 6. Criar um organizador padrão de demonstração para a Comissão Organizadora
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'organizador@sesc.com')
    } catch (_) {
      try {
        const orgRecord = new Record(users)
        orgRecord.setEmail('organizador@sesc.com')
        orgRecord.setPassword('Vivatec@2026')
        orgRecord.setVerified(true)
        orgRecord.set('name', 'Coord. Mariana Dias (Comissão Viva Tec)')
        orgRecord.set('role', 'organizer')
        orgRecord.set('is_active', true)
        orgRecord.set('is_evaluator', false)
        orgRecord.set('quick_token', 'org1')
        app.save(orgRecord)
      } catch (err) {
        console.warn('Erro ao criar organizador inicial:', err)
      }
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'evaluator']
    }
    if (users.fields.getByName('is_evaluator')) {
      users.fields.removeByName('is_evaluator')
    }
    users.manageRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(users)
  },
)
