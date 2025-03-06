// /backend/swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config/config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rezeptverwaltung API',
      version: '1.0.0',
      description: 'API für die Rezeptverwaltungs-Webanwendung',
    },
    servers: [
      {
        url: config.LOGIN_URL,
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
};
