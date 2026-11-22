// Configuración de Express: middlewares globales, documentación, rutas y manejo de errores.
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./docs/swagger");
const routes = require("./routes");
const { noEncontrado, manejarErrores } = require("./middlewares/error.middleware");

const app = express();

// CORS: en producción se limita a los dominios del front y la app (CORS_ORIGIN separado por comas).
const origenes = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*";
app.use(cors({ origin: origenes }));

app.use(express.json());

// Documentación Swagger
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Todas las rutas de la API cuelgan de /api
app.use("/api", routes);

// Siempre al final: ruta inexistente y errores
app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
