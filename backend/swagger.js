// /backend/swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
};
