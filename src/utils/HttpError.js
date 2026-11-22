// Error con código HTTP. Los servicios lo lanzan y el middleware de errores lo responde.
// Ejemplo: throw new HttpError(404, "Producto no encontrado");
class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

module.exports = HttpError;
