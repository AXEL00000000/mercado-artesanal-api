// Punto de entrada: carga variables de entorno y levanta el servidor.
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/api/docs`);
});
