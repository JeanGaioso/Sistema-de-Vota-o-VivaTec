migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Seed Admin User
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'jeangaioso@gmail.com')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('jeangaioso@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Prof. Jean Gaioso (Coordenação Sesc)')
      app.save(admin)
    }

    // 2. Seed Evaluator 1 User
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator1@sesc.com')
    } catch (_) {
      const eval1 = new Record(users)
      eval1.setEmail('evaluator1@sesc.com')
      eval1.setPassword('Skip@Pass')
      eval1.setVerified(true)
      eval1.set('name', 'Avaliadora Dra. Clara Rios (Banca Sesc)')
      app.save(eval1)
    }

    // 3. Seed Evaluator 2 User (para demonstrar cálculo de média com múltiplos jurados)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator2@sesc.com')
    } catch (_) {
      const eval2 = new Record(users)
      eval2.setEmail('evaluator2@sesc.com')
      eval2.setPassword('Skip@Pass')
      eval2.setVerified(true)
      eval2.set('name', 'Avaliador Me. Lucas Andrade (Banca Artes)')
      app.save(eval2)
    }

    // 4. Seed Settings
    const settingsCol = app.findCollectionByNameOrId('settings')
    try {
      app.findFirstRecordByData('settings', 'key', 'event_status')
    } catch (_) {
      const settingStatus = new Record(settingsCol)
      settingStatus.set('key', 'event_status')
      settingStatus.set('value', 'waiting') // "waiting" ou "published"
      app.save(settingStatus)
    }

    try {
      app.findFirstRecordByData('settings', 'key', 'event_name')
    } catch (_) {
      const settingEvent = new Record(settingsCol)
      settingEvent.set('key', 'event_name')
      settingEvent.set('value', 'Festival de Apresentação Artística de Heróis Fictícios')
      app.save(settingEvent)
    }

    // 5. Seed Startups
    const startupsCol = app.findCollectionByNameOrId('startups')
    let ecoGuardiansId = null
    let civicKnightsId = null
    let solarisId = null
    let bioRootsId = null

    try {
      const rec = app.findFirstRecordByData('startups', 'name', 'Eco-Guardians')
      ecoGuardiansId = rec.id
    } catch (_) {
      const eco = new Record(startupsCol)
      eco.set('name', 'Eco-Guardians')
      eco.set('hero_name', 'Terra-Man')
      eco.set('esg_pillar', 'Ambiental')
      eco.set(
        'synopsis',
        'Uma épica jornada para proteger a Amazônia contra a desertificação e os crimes ambientais, utilizando tecnologia de regeneração biológica e bioescudos sonoros.',
      )
      eco.set('time_penalty', 0)
      eco.set('order', 1)
      app.save(eco)
      ecoGuardiansId = eco.id
    }

    try {
      const rec = app.findFirstRecordByData('startups', 'name', 'Civic Knights')
      civicKnightsId = rec.id
    } catch (_) {
      const civic = new Record(startupsCol)
      civic.set('name', 'Civic Knights')
      civic.set('hero_name', 'Justiça')
      civic.set('esg_pillar', 'Governança')
      civic.set(
        'synopsis',
        'Combate implacável à corrupção e desvio de verbas em uma metrópole cibernética futurista, empregando redes neurais de transparência pública e drones de auditoria social.',
      )
      civic.set('time_penalty', 0)
      civic.set('order', 2)
      app.save(civic)
      civicKnightsId = civic.id
    }

    try {
      const rec = app.findFirstRecordByData('startups', 'name', 'Solaris Energy')
      solarisId = rec.id
    } catch (_) {
      const sol = new Record(startupsCol)
      sol.set('name', 'Solaris Energy')
      sol.set('hero_name', 'Fóton')
      sol.set('esg_pillar', 'Social')
      sol.set(
        'synopsis',
        'Democratização do acesso à energia limpa em comunidades isoladas e periferias, liderada pelo herói Fóton que converte luz solar direta em microredes comunitárias autônomas.',
      )
      sol.set('time_penalty', 1) // 1 ponto de penalidade de tempo
      sol.set('order', 3)
      app.save(sol)
      solarisId = sol.id
    }

    try {
      const rec = app.findFirstRecordByData('startups', 'name', 'Bio-Roots')
      bioRootsId = rec.id
    } catch (_) {
      const bio = new Record(startupsCol)
      bio.set('name', 'Bio-Roots')
      bio.set('hero_name', 'Flora')
      bio.set('esg_pillar', 'Ambiental')
      bio.set(
        'synopsis',
        'Restauração da flora nativa urbana e segurança alimentar por meio de hortas verticais regenerativas e micélios bioluminescentes.',
      )
      bio.set('time_penalty', 0)
      bio.set('order', 4)
      app.save(bio)
      bioRootsId = bio.id
    }

    // 6. Seed Sample Evaluations from evaluator1 and evaluator2
    const evalCol = app.findCollectionByNameOrId('evaluations')
    const eval1User = app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator1@sesc.com')
    const eval2User = app.findAuthRecordByEmail('_pb_users_auth_', 'evaluator2@sesc.com')

    if (ecoGuardiansId && eval1User) {
      try {
        const rec = new Record(evalCol)
        rec.set('startup', ecoGuardiansId)
        rec.set('evaluator', eval1User.id)
        rec.set('score_criatividade', 19)
        rec.set('score_figurino', 14)
        rec.set('score_esg', 20)
        rec.set('score_narrativa', 14)
        rec.set('score_engajamento', 15)
        rec.set('score_briefing', 9)
        rec.set('score_gestao_tempo', 5)
        rec.set(
          'feedback',
          'Apresentação impressionante! A contextualização do pilar Ambiental e a caracterização do herói Terra-Man foram impecáveis.',
        )
        rec.set('is_finalized', true)
        app.save(rec)
      } catch (_) {}
    }

    if (civicKnightsId && eval1User) {
      try {
        const rec = new Record(evalCol)
        rec.set('startup', civicKnightsId)
        rec.set('evaluator', eval1User.id)
        rec.set('score_criatividade', 18)
        rec.set('score_figurino', 13)
        rec.set('score_esg', 19)
        rec.set('score_narrativa', 14)
        rec.set('score_engajamento', 14)
        rec.set('score_briefing', 10)
        rec.set('score_gestao_tempo', 5)
        rec.set(
          'feedback',
          'Excelente clareza no tema de Governança e transparência. Figurino muito coerente com a proposta cyberpunk.',
        )
        rec.set('is_finalized', true)
        app.save(rec)
      } catch (_) {}
    }

    if (ecoGuardiansId && eval2User) {
      try {
        const rec = new Record(evalCol)
        rec.set('startup', ecoGuardiansId)
        rec.set('evaluator', eval2User.id)
        rec.set('score_criatividade', 18)
        rec.set('score_figurino', 15)
        rec.set('score_esg', 19)
        rec.set('score_narrativa', 15)
        rec.set('score_engajamento', 14)
        rec.set('score_briefing', 10)
        rec.set('score_gestao_tempo', 5)
        rec.set('feedback', 'Narrativa muito envolvente e forte apelo pedagógico.')
        rec.set('is_finalized', true)
        app.save(rec)
      } catch (_) {}
    }
  },
  (app) => {
    // down migration
  },
)
