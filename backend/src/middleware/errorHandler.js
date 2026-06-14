import multer from 'multer';

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no puede superar los 2 MB.'
        : 'No se pudo procesar la imagen.';
    return res.status(400).json({ message });
  }

  if (error.code === '23505') {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos.' });
  }
  if (error.code === '23503') {
    return res.status(409).json({ message: 'El registro está relacionado con otros datos.' });
  }
  if (error.code === '22P02') {
    return res.status(400).json({ message: 'El identificador recibido no es válido.' });
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Error interno del servidor'
  });
}
