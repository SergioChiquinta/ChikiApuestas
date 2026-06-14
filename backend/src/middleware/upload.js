import multer from 'multer';

const acceptedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export const uploadProfile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
      return callback(
        Object.assign(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), {
          status: 400
        })
      );
    }

    callback(null, true);
  }
});
