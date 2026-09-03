migrate(
  (app) => {
    const startupsCol = app.findCollectionByNameOrId('startups')

    if (!startupsCol.fields.getByName('briefing_file')) {
      startupsCol.fields.add(
        new FileField({
          name: 'briefing_file',
          maxSelect: 1,
          maxSize: 20971520, // 20 MB
          mimeTypes: ['application/pdf'],
        }),
      )
      app.save(startupsCol)
    }
  },
  (app) => {
    try {
      const startupsCol = app.findCollectionByNameOrId('startups')
      const field = startupsCol.fields.getByName('briefing_file')
      if (field) {
        startupsCol.fields.removeByName('briefing_file')
        app.save(startupsCol)
      }
    } catch (_) {}
  },
)
