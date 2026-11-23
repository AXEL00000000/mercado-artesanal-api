const HttpError = require("./HttpError");

const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor > 0;

const validarId = (texto, campo = "El id") => {
  const id = Number(texto);
  if (!esEnteroPositivo(id)) throw new HttpError(400, `${campo} debe ser un número entero positivo`);
  return id;
};

const esTextoVacio = (valor) => typeof valor !== "string" || !valor.trim();

// "Cántaro de Barro Negro" -> "cantaro-de-barro-negro"
const generarSlug = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

module.exports = { esEnteroPositivo, validarId, esTextoVacio, generarSlug };
