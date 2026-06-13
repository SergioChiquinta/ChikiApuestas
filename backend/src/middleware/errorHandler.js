import multer from 'multer';

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar los 2 MB.'
      : 'No se pudo procesar la imagen.';
    return res.status(400).json({ message });
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Error interno del servidor'
  });
}
