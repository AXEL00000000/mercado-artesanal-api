const Producto = require("../models/producto.model");
const HttpError = require("../utils/HttpError");
const { REGIONES } = require("./comunidad.service");

const ORDENES = ["recientes", "precio_asc", "precio_desc"];
const MODOS = ["fijo", "tratar"];

const enteroPositivo = (valor, campo, errores) => {
  if (valor === undefined) return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) errores.push(`${campo} debe ser un número entero positivo`);
  return n;
};

const listar = async (filtros) => {
  const errores = [];
  const comunidad = enteroPositivo(filtros.comunidad, "comunidad", errores);
  const productor = enteroPositivo(filtros.productor, "productor", errores);
  const pagina = enteroPositivo(filtros.pagina, "pagina", errores) || 1;
  const limite = enteroPositivo(filtros.limite, "limite", errores) || 12;
  const orden = filtros.orden || "recientes";

  if (limite > 50) errores.push("limite no puede ser mayor a 50");
  if (!ORDENES.includes(orden)) errores.push(`orden debe ser uno de: ${ORDENES.join(", ")}`);
  if (filtros.modo && !MODOS.includes(filtros.modo)) errores.push(`modo debe ser uno de: ${MODOS.join(", ")}`);
  if (filtros.region && !REGIONES.includes(filtros.region)) errores.push("region no es una de las 8 regiones de Oaxaca");
  if (errores.length) throw new HttpError(400, "Filtros inválidos", errores);

  const { total, productos } = await Producto.listar({
    categoria: filtros.categoria,
    comunidad,
    region: filtros.region,
    productor,
    modo: filtros.modo,
    q: filtros.q && filtros.q.trim(),
    orden,
    limite,
    offset: (pagina - 1) * limite,
  });

  return { pagina, limite, total, total_paginas: Math.ceil(total / limite), productos };
};

const obtener = async (slug) => {
  const producto = await Producto.buscarPorSlug(slug);
  if (!producto) throw new HttpError(404, "Producto no encontrado");

  const mensaje = `Hola, me interesa "${producto.nombre}" que vi en Mercado Artesanal`;
  producto.whatsapp_url = `https://wa.me/${producto.productor.whatsapp}?text=${encodeURIComponent(mensaje)}`;
  return producto;
};

module.exports = { listar, obtener };
