const miTallerService = require("../services/mi-taller.service");
const miProductoService = require("../services/mi-producto.service");

const crearTaller = async (req, res) => {
  res.status(201).json(await miTallerService.crear(req.usuario.id, req.body || {}));
};

const obtenerTaller = async (req, res) => {
  res.json(req.productor);
};

const actualizarTaller = async (req, res) => {
  res.json(await miTallerService.actualizar(req.productor, req.body || {}));
};

const listarProductos = async (req, res) => {
  res.json(await miProductoService.listar(req.productor));
};

const obtenerProducto = async (req, res) => {
  res.json(await miProductoService.obtener(req.productor, req.params.id));
};

const crearProducto = async (req, res) => {
  res.status(201).json(await miProductoService.crear(req.productor, req.body || {}));
};

const actualizarProducto = async (req, res) => {
  res.json(await miProductoService.actualizar(req.productor, req.params.id, req.body || {}));
};

const cambiarActivoProducto = async (req, res) => {
  res.json(await miProductoService.cambiarActivo(req.productor, req.params.id, req.body || {}));
};

const agregarImagen = async (req, res) => {
  res.status(201).json(await miProductoService.agregarImagen(req.productor, req.params.id, req.file));
};

const eliminarImagen = async (req, res) => {
  await miProductoService.eliminarImagen(req.productor, req.params.id, req.params.imagenId);
  res.status(204).end();
};

const marcarImagenPrincipal = async (req, res) => {
  res.json(await miProductoService.marcarPrincipal(req.productor, req.params.id, req.params.imagenId));
};

module.exports = {
  crearTaller, obtenerTaller, actualizarTaller,
  listarProductos, obtenerProducto, crearProducto, actualizarProducto, cambiarActivoProducto,
  agregarImagen, eliminarImagen, marcarImagenPrincipal,
};
