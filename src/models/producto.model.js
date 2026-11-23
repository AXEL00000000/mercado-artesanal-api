const { query } = require("../config/db");

const ORDENES = {
  recientes: "p.created_at DESC, p.id DESC",
  precio_asc: "p.precio ASC, p.id",
  precio_desc: "p.precio DESC, p.id",
};

const aTarjeta = (fila) => ({
  id: fila.id,
  nombre: fila.nombre,
  slug: fila.slug,
  precio: fila.precio,
  modo_venta: fila.modo_venta,
  stock: fila.stock,
  imagen: fila.imagen,
  categoria: { slug: fila.categoria_slug, nombre: fila.categoria_nombre },
  productor: { id: fila.productor_id, nombre_taller: fila.nombre_taller },
  comunidad: { id: fila.comunidad_id, nombre: fila.comunidad_nombre, region: fila.region },
});

// Productos activos de talleres aprobados, con filtros y paginación
const listar = async ({ categoria, comunidad, region, productor, modo, q, orden, limite, offset }) => {
  const condiciones = ["p.activo", "pr.estado_verificacion = 'aprobado'"];
  const valores = [];
  const agregar = (sql, valor) => {
    valores.push(valor);
    condiciones.push(sql.replaceAll("?", `$${valores.length}`));
  };

  if (categoria) agregar("cat.slug = ?", categoria);
  if (comunidad) agregar("c.id = ?", comunidad);
  if (region) agregar("c.region = ?", region);
  if (productor) agregar("pr.id = ?", productor);
  if (modo) agregar("p.modo_venta = ?", modo);
  if (q) agregar("(p.nombre ILIKE ? OR p.descripcion ILIKE ?)", `%${q}%`);

  valores.push(limite, offset);
  const { rows } = await query(
    `SELECT p.id, p.nombre, p.slug, p.precio, p.modo_venta, p.stock,
            img.url AS imagen,
            cat.slug AS categoria_slug, cat.nombre AS categoria_nombre,
            pr.id AS productor_id, pr.nombre_taller,
            c.id AS comunidad_id, c.nombre AS comunidad_nombre, c.region,
            COUNT(*) OVER ()::int AS total
       FROM producto p
       JOIN productor pr ON pr.id = p.productor_id
       JOIN comunidad c ON c.id = pr.comunidad_id
       JOIN categoria cat ON cat.id = p.categoria_id
       LEFT JOIN imagen_producto img ON img.producto_id = p.id AND img.es_principal
      WHERE ${condiciones.join(" AND ")}
      ORDER BY ${ORDENES[orden]}
      LIMIT $${valores.length - 1} OFFSET $${valores.length}`,
    valores
  );

  return { total: rows[0] ? rows[0].total : 0, productos: rows.map(aTarjeta) };
};

// Detalle completo de un producto activo de un taller aprobado
const buscarPorSlug = async (slug) => {
  const { rows } = await query(
    `SELECT p.id, p.nombre, p.slug, p.descripcion, p.modo_venta, p.precio, p.stock,
            p.material, p.tecnica, p.peso_g, p.alto_cm, p.ancho_cm, p.largo_cm,
            cat.slug AS categoria_slug, cat.nombre AS categoria_nombre,
            pr.id AS productor_id, pr.nombre_taller, pr.biografia, pr.foto_url, pr.whatsapp,
            u.nombre AS artesano,
            c.id AS comunidad_id, c.nombre AS comunidad_nombre, c.municipio, c.region
       FROM producto p
       JOIN productor pr ON pr.id = p.productor_id
       JOIN usuario u ON u.id = pr.usuario_id
       JOIN comunidad c ON c.id = pr.comunidad_id
       JOIN categoria cat ON cat.id = p.categoria_id
      WHERE p.slug = $1 AND p.activo AND pr.estado_verificacion = 'aprobado'`,
    [slug]
  );
  const f = rows[0];
  if (!f) return null;

  const imagenes = await query(
    `SELECT id, url, orden, es_principal
       FROM imagen_producto
      WHERE producto_id = $1
      ORDER BY es_principal DESC, orden, id`,
    [f.id]
  );

  return {
    id: f.id,
    nombre: f.nombre,
    slug: f.slug,
    descripcion: f.descripcion,
    modo_venta: f.modo_venta,
    precio: f.precio,
    stock: f.stock,
    material: f.material,
    tecnica: f.tecnica,
    peso_g: f.peso_g,
    medidas_cm: { alto: f.alto_cm, ancho: f.ancho_cm, largo: f.largo_cm },
    imagenes: imagenes.rows,
    categoria: { slug: f.categoria_slug, nombre: f.categoria_nombre },
    productor: {
      id: f.productor_id,
      nombre_taller: f.nombre_taller,
      artesano: f.artesano,
      biografia: f.biografia,
      foto_url: f.foto_url,
      whatsapp: f.whatsapp,
    },
    comunidad: { id: f.comunidad_id, nombre: f.comunidad_nombre, municipio: f.municipio, region: f.region },
  };
};

const CAMPOS_PROPIOS = `
  p.id, p.nombre, p.slug, p.descripcion, p.modo_venta, p.precio, p.stock,
  p.material, p.tecnica, p.peso_g, p.alto_cm, p.ancho_cm, p.largo_cm,
  p.activo, p.created_at, p.updated_at,
  cat.id AS categoria_id, cat.slug AS categoria_slug, cat.nombre AS categoria_nombre`;

const aProductoPropio = (f) => ({
  id: f.id,
  nombre: f.nombre,
  slug: f.slug,
  descripcion: f.descripcion,
  modo_venta: f.modo_venta,
  precio: f.precio,
  stock: f.stock,
  material: f.material,
  tecnica: f.tecnica,
  peso_g: f.peso_g,
  medidas_cm: { alto: f.alto_cm, ancho: f.ancho_cm, largo: f.largo_cm },
  activo: f.activo,
  categoria: { id: f.categoria_id, slug: f.categoria_slug, nombre: f.categoria_nombre },
  ...(f.imagen !== undefined && { imagen: f.imagen }),
  created_at: f.created_at,
  updated_at: f.updated_at,
});

// Todos los productos de un taller, activos e inactivos
const listarDeProductor = async (productorId) => {
  const { rows } = await query(
    `SELECT ${CAMPOS_PROPIOS}, img.url AS imagen
       FROM producto p
       JOIN categoria cat ON cat.id = p.categoria_id
       LEFT JOIN imagen_producto img ON img.producto_id = p.id AND img.es_principal
      WHERE p.productor_id = $1
      ORDER BY p.created_at DESC, p.id DESC`,
    [productorId]
  );
  return rows.map(aProductoPropio);
};

const buscarDeProductor = async (id, productorId) => {
  const { rows } = await query(
    `SELECT ${CAMPOS_PROPIOS}
       FROM producto p
       JOIN categoria cat ON cat.id = p.categoria_id
      WHERE p.id = $1 AND p.productor_id = $2`,
    [id, productorId]
  );
  return rows[0] ? aProductoPropio(rows[0]) : null;
};

// Slugs que ya existen con esa base: "tapete" y "tapete-2", "tapete-3"...
const slugsSimilares = async (base, excluirId) => {
  const { rows } = await query(
    `SELECT slug FROM producto
      WHERE (slug = $1 OR slug ~ ('^' || $1 || '-[0-9]+$'))
        AND ($2::bigint IS NULL OR id <> $2)`,
    [base, excluirId || null]
  );
  return rows.map((r) => r.slug);
};

const COLUMNAS_EDITABLES = [
  "categoria_id", "nombre", "slug", "descripcion", "modo_venta", "precio", "stock",
  "material", "tecnica", "peso_g", "alto_cm", "ancho_cm", "largo_cm", "activo",
];

const crear = async (productorId, d) => {
  const columnas = COLUMNAS_EDITABLES.filter((c) => d[c] !== undefined);
  const marcas = columnas.map((_, i) => `$${i + 2}`);
  const { rows } = await query(
    `INSERT INTO producto (productor_id, ${columnas.join(", ")})
     VALUES ($1, ${marcas.join(", ")})
     RETURNING id`,
    [productorId, ...columnas.map((c) => d[c])]
  );
  return rows[0].id;
};

const actualizar = async (id, cambios) => {
  const columnas = COLUMNAS_EDITABLES.filter((c) => cambios[c] !== undefined);
  if (!columnas.length) return;
  const sets = columnas.map((c, i) => `${c} = $${i + 2}`);
  await query(
    `UPDATE producto SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $1`,
    [id, ...columnas.map((c) => cambios[c])]
  );
};

module.exports = { listar, buscarPorSlug, listarDeProductor, buscarDeProductor, slugsSimilares, crear, actualizar };
