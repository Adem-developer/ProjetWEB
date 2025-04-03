const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Web ExpressJS',
      version: '1.0.0',
      description: 'API projet web',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['src/routes/*.js'],
}

const specs = swaggerJsdoc(options)


module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}
