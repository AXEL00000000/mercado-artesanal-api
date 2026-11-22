// Especificación OpenAPI. Cada archivo de rutas documenta sus endpoints
// con comentarios @openapi, y aquí se juntan.
const swaggerJsdoc = require("swagger-jsdoc");

const opciones = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Mercado Artesanal API",
      version: "1.0.0",
      description:
        "API REST del marketplace de artesanía de comunidades de Oaxaca. " +
        "La consumen el sitio web (Vue) y la app móvil (Ionic).",
    },
    servers: [{ url: "/", description: "Este servidor" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Mensaje del error" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(opciones);
