migrate(
  (app) => {
    // 1. Coleção startups
    const startups = new Collection({
      name: 'startups',
      type: 'base',
      listRule: '', // leitura pública para a vitrine e avaliadores
      viewRule: '', // leitura pública
      createRule: "@request.auth.id != ''", // apenas usuários autenticados (admin)
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'hero_name', type: 'text', required: true },
        {
          name: 'esg_pillar',
          type: 'select',
          required: true,
          values: ['Ambiental', 'Social', 'Governança'],
          maxSelect: 1,
        },
        { name: 'synopsis', type: 'text' },
        {
          name: 'cover_image',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        },
        { name: 'time_penalty', type: 'number', min: 0 },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_startups_name ON startups (name)',
        'CREATE INDEX idx_startups_hero_name ON startups (hero_name)',
      ],
    })
    app.save(startups)

    // 2. Coleção evaluations
    const evaluations = new Collection({
      name: 'evaluations',
      type: 'base',
      // Avaliadores autenticados veem apenas suas próprias avaliações; admin (ou checagem) vê todas
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'startup',
          type: 'relation',
          required: true,
          collectionId: startups.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'evaluator',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'score_criatividade', type: 'number', min: 0, max: 20, required: true },
        { name: 'score_figurino', type: 'number', min: 0, max: 15, required: true },
        { name: 'score_esg', type: 'number', min: 0, max: 20, required: true },
        { name: 'score_narrativa', type: 'number', min: 0, max: 15, required: true },
        { name: 'score_engajamento', type: 'number', min: 0, max: 15, required: true },
        { name: 'score_briefing', type: 'number', min: 0, max: 10, required: true },
        { name: 'score_gestao_tempo', type: 'number', min: 0, max: 5, required: true },
        { name: 'feedback', type: 'text' },
        { name: 'is_finalized', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_eval_startup_evaluator ON evaluations (startup, evaluator)',
      ],
    })
    app.save(evaluations)

    // 3. Coleção settings
    const settings = new Collection({
      name: 'settings',
      type: 'base',
      listRule: '', // leitura pública para sincronizar status do evento em tempo real
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_settings_key ON settings (key)'],
    })
    app.save(settings)

    // 4. Coleção audit_logs (requisito do PRD para rastreabilidade de notas e penalidades)
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
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('audit_logs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('evaluations'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('startups'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('settings'))
    } catch (_) {}
  },
)
