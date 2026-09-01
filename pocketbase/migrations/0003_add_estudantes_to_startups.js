migrate(
  (app) => {
    const startupsCol = app.findCollectionByNameOrId('startups')

    // 1. Adicionar campo 'estudantes' (text) caso ainda não exista
    if (!startupsCol.fields.getByName('estudantes')) {
      startupsCol.fields.add(
        new TextField({
          name: 'estudantes',
          type: 'text',
          required: false,
        }),
      )
      app.save(startupsCol)
    }

    // 2. Atualizar startups existentes com nomes de estudantes modelo do Viva Tec
    try {
      const eco = app.findFirstRecordByData('startups', 'name', 'Eco-Guardians')
      eco.set(
        'estudantes',
        'Ana Beatriz Lima, Carlos Eduardo Rocha, Larissa Santos, Pedro Henrique Alves',
      )
      app.save(eco)
    } catch (_) {}

    try {
      const civic = app.findFirstRecordByData('startups', 'name', 'Civic Knights')
      civic.set('estudantes', 'Gabriel Fonseca, Mariana Costa, Lucas Oliveira, Isabella Martins')
      app.save(civic)
    } catch (_) {}

    try {
      const sol = app.findFirstRecordByData('startups', 'name', 'Solaris Energy')
      sol.set('estudantes', 'Rafael Silveira, Julia Nascimento, Matheus Ribeiro, Giovanna Freitas')
      app.save(sol)
    } catch (_) {}

    try {
      const bio = app.findFirstRecordByData('startups', 'name', 'Bio-Roots')
      bio.set('estudantes', 'Bruno Carvalho, Amanda Guimarães, Thiago Pires, Letícia Medeiros')
      app.save(bio)
    } catch (_) {}
  },
  (app) => {
    try {
      const startupsCol = app.findCollectionByNameOrId('startups')
      const field = startupsCol.fields.getByName('estudantes')
      if (field) {
        startupsCol.fields.removeByName('estudantes')
        app.save(startupsCol)
      }
    } catch (_) {}
  },
)
