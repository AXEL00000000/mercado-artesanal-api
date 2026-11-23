// Cliente de Supabase Storage con la llave secreta del servidor.
const { createClient } = require("@supabase/supabase-js");

const BUCKET_PRODUCTOS = "productos";

let cliente = null;

const obtenerCliente = () => {
  if (!cliente) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env");
    }
    cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
};

const subir = async (ruta, buffer, contentType) => {
  const bucket = obtenerCliente().storage.from(BUCKET_PRODUCTOS);
  const { error } = await bucket.upload(ruta, buffer, { contentType, upsert: false });
  if (error) throw error;
  return bucket.getPublicUrl(ruta).data.publicUrl;
};

// Devuelve la ruta dentro del bucket si la URL es de nuestro bucket; si no, null.
const rutaDesdeUrl = (url) => {
  const marca = `/storage/v1/object/public/${BUCKET_PRODUCTOS}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
};

const eliminar = async (ruta) => {
  const { error } = await obtenerCliente().storage.from(BUCKET_PRODUCTOS).remove([ruta]);
  if (error) throw error;
};

module.exports = { subir, eliminar, rutaDesdeUrl };
