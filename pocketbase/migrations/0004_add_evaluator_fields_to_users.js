migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'role' (select: 'admin', 'evaluator') se não existir
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          type: 'select',
          required: false,
          values: ['admin', 'evaluator'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Adicionar campo 'is_active' (bool - opcional para não falhar com false) se não existir
    if (!users.fields.getByName('is_active')) {
      users.fields.add(
        new BoolField({
          name: 'is_active',
          type: 'bool',
          required: false,
        }),
      )
    }

    // 3. Adicionar campo 'quick_token' (text) para login rápido via token/QR se não existir
    if (!users.fields.getByName('quick_token')) {
      users.fields.add(
        new TextField({
          name: 'quick_token',
          type: 'text',
          required: false,
        }),
      )
    }

    // 4. Atualizar regras de acesso do users:
    // Usuários autenticados podem listar outros usuários (necessário para Admin listar avaliadores e expandir nomes de jurados)
    // Create, update, delete permitidos para usuários autenticados (ou admin)
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.id != ''"
    users.updateRule = "@request.auth.id != ''"
    // Não permitir delete indiscriminado, apenas auth
    users.deleteRule = "@request.auth.id != ''"

    app.save(users)

    // 5. Atualizar registros existentes de usuários com role e is_active
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'jeangaioso@gmail.com')
      admin.set('role', 'admin')
      admin.set('is_active', true)
      admin.set('quick_token', 'admin')
      app.save(admin)
    } catch (_) {}

    try {
      const eval1 = app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator1@sesc.com')
      eval1.set('role', 'evaluator')
      eval1.set('is_active', true)
      eval1.set('quick_token', 'eval1')
      app.save(eval1)
    } catch (_) {}

    try {
      const eval2 = app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator2@sesc.com')
      eval2.set('role', 'evaluator')
      eval2.set('is_active', true)
      eval2.set('quick_token', 'eval2')
      app.save(eval2)
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }
    if (users.fields.getByName('is_active')) {
      users.fields.removeByName('is_active')
    }
    if (users.fields.getByName('quick_token')) {
      users.fields.removeByName('quick_token')
    }
    app.save(users)
  },
)
