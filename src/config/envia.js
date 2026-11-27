// Cliente de Envia.com en modo sandbox.
const HttpError = require("../utils/HttpError");

const URL_RATE = "https://api-test.envia.com/ship/rate/";
const URL_CP = "https://geocodes.envia.com/zipcode/MX/";
const PAQUETERIAS = ["fedex", "estafeta", "dhl"];
const TIEMPO_MAXIMO_MS = 15000;

const errorEnvia = () => new HttpError(502, "No se pudo cotizar el envío con Envia, intenta más tarde");

// Datos de un CP de México según Envia; null si no existe.
// Envia responde un arreglo vacío cuando el CP no existe.
const consultarCp = async (cp, mensajeError) => {
  let datos;
  try {
    const res = await fetch(URL_CP + cp, {
      headers: { Authorization: `Bearer ${process.env.ENVIA_API_KEY}` },
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    datos = await res.json();
    if (!Array.isArray(datos)) throw new Error("respuesta inesperada");
  } catch (err) {
    console.error("Error al consultar CP en Envia:", err.message);
    throw new HttpError(502, mensajeError);
  }
  const lugar = datos[0];
  if (!lugar) return null;
  return {
    cp: lugar.zip_code,
    estado: lugar.state.name,
    codigo_estado: lugar.state.code["2digit"],
    ciudad: lugar.locality,
    municipio: (lugar.regions && lugar.regions.region_2) || lugar.locality,
    colonias: lugar.suburbs || [],
  };
};

// Ciudad y estado (código de 2 letras) de un CP de México; null si no existe
const buscarCp = async (cp) => {
  const lugar = await consultarCp(cp, errorEnvia().message);
  return lugar && { ciudad: lugar.ciudad, estado: lugar.codigo_estado };
};

const cotizarConPaqueteria = async (carrier, cuerpo) => {
  const res = await fetch(URL_RATE, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ENVIA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...cuerpo, shipment: { type: 1, carrier } }),
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
  });
  const datos = await res.json();
  if (!res.ok || datos.meta === "error" || !Array.isArray(datos.data)) {
    throw new Error(`${carrier}: ${(datos.error && datos.error.message) || res.status}`);
  }
  return datos.data;
};

// Cotiza con todas las paqueterías; las que fallan se omiten. Si fallan todas, 502.
const cotizar = async ({ origen, destino, paquetes }) => {
  if (!process.env.ENVIA_API_KEY) {
    console.error("Falta ENVIA_API_KEY en el archivo .env");
    throw errorEnvia();
  }
  const cuerpo = { origin: origen, destination: destino, packages: paquetes, settings: { currency: "MXN" } };
  const resultados = await Promise.allSettled(PAQUETERIAS.map((c) => cotizarConPaqueteria(c, cuerpo)));

  const tarifas = resultados.filter((r) => r.status === "fulfilled").flatMap((r) => r.value);
  resultados
    .filter((r) => r.status === "rejected")
    .forEach((r) => console.error("Envia no cotizó con", r.reason.message));
  if (!tarifas.length) throw errorEnvia();

  return tarifas.map((t) => ({
    paqueteria: t.carrier,
    servicio: t.serviceDescription.trim(),
    costo: t.totalPrice,
    dias: t.deliveryDate ? t.deliveryDate.dateDifference : null,
  }));
};

module.exports = { consultarCp, buscarCp, cotizar };
