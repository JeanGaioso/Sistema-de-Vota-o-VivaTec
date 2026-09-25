migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Criar audit_logs se não existir para evitar erros 404 em log de auditoria
    try {
      app.findCollectionByNameOrId('audit_logs')
    } catch (_) {
      try {
        const auditLogs = new Collection({
          name: 'audit_logs',
          type: 'base',
          listRule: "@request.auth.id != ''",
          viewRule: "@request.auth.id != ''",
          createRule: "@request.auth.id != ''",
          updateRule: "@request.auth.id != ''",
          deleteRule: "@request.auth.id != ''",
          fields: [
            { name: 'action', type: 'text', required: true },
            { name: 'details', type: 'text' },
            { name: 'user_email', type: 'text' },
            { name: 'startup_name', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        })
        app.save(auditLogs)
      } catch (err) {
        console.warn('Coleção audit_logs não pôde ser criada:', err)
      }
    }

    // 2. Garantir Avaliadora Dra. Clara Rios
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator1@sesc.com')
    } catch (_) {
      try {
        const eval1 = new Record(users)
        eval1.setEmail('evaluator1@sesc.com')
        eval1.setPassword('Vivatec@2026')
        eval1.setVerified(true)
        eval1.set('name', 'Avaliadora Dra. Clara (Banca Senac/Sesc)')
        eval1.set('role', 'evaluator')
        eval1.set('is_active', true)
        eval1.set('is_evaluator', true)
        eval1.set('quick_token', 'eval1')
        app.save(eval1)
      } catch (e) {
        console.warn('Erro ao criar evaluator1:', e)
      }
    }

    // 3. Garantir Avaliador Me. Lucas Andrade
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator2@sesc.com')
    } catch (_) {
      try {
        const eval2 = new Record(users)
        eval2.setEmail('evaluator2@sesc.com')
        eval2.setPassword('Vivatec@2026')
        eval2.setVerified(true)
        eval2.set('name', 'Avaliador Me. Lucas (Banca Artes)')
        eval2.set('role', 'evaluator')
        eval2.set('is_active', true)
        eval2.set('is_evaluator', true)
        eval2.set('quick_token', 'eval2')
        app.save(eval2)
      } catch (e) {
        console.warn('Erro ao criar evaluator2:', e)
      }
    }

    // 4. Garantir Coord. Mariana Dias
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'organizador@sesc.com')
    } catch (_) {
      try {
        const orgRecord = new Record(users)
        orgRecord.setEmail('organizador@sesc.com')
        orgRecord.setPassword('Vivatec@2026')
        orgRecord.setVerified(true)
        orgRecord.set('name', 'Coord. Mariana Dias (Comissão Organizadora)')
        orgRecord.set('role', 'organizer')
        orgRecord.set('is_active', true)
        orgRecord.set('is_evaluator', false)
        orgRecord.set('quick_token', 'org1')
        app.save(orgRecord)
      } catch (e) {
        console.warn('Erro ao criar organizador mariana:', e)
      }
    }

    // 5. Garantir Glailton Robson com senha sincronizada e is_evaluator definido se não tiver
    try {
      const glailton = app.findAuthRecordByEmail('_pb_users_auth_', 'glailtonrobson@yahoo.com.br')
      if (!glailton.get('quick_token')) {
        glailton.set('quick_token', 'GlaGla')
      }
      glailton.setPassword('Vivatec@2026')
      glailton.setVerified(true)
      app.save(glailton)
    } catch (_) {}

    // 6. Garantir Prof. Jean Gaioso com is_evaluator = true e quick_token admin
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'jeangaioso@gmail.com')
      admin.set('is_evaluator', true)
      admin.set('quick_token', 'admin')
      admin.setPassword('Vivatec@2026')
      admin.setVerified(true)
      app.save(admin)
    } catch (_) {}
  },
  (app) => {
    // down migration
  },
)
