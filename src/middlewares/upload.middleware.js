const multer = require("multer");
const HttpError = require("../utils/HttpError");

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

const multerImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO, files: 1 },
  fileFilter: (req, archivo, cb) => {
    if (TIPOS_IMAGEN.includes(archivo.mimetype)) return cb(null, true);
    cb(new HttpError(400, "La imagen debe ser jpg, png o webp"));
  },
}).single("imagen");

// Recibe un archivo en el campo "imagen" y lo deja en req.file (en memoria)
const subirImagen = (req, res, next) => {
  multerImagen(req, res, (err) => {
    if (!err) return next();
    if (err instanceof HttpError) return next(err);
    if (err.code === "LIMIT_FILE_SIZE") return next(new HttpError(413, "La imagen no puede pesar más de 5 MB"));
    if (err instanceof multer.MulterError) return next(new HttpError(400, "Envía una sola imagen en el campo 'imagen'"));
    next(err);
  });
};

module.exports = { subirImagen, TIPOS_IMAGEN };
