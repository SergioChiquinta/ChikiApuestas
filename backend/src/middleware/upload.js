import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';

const uploadDirectory = fileURLToPath(new URL('../../uploads/perfiles/', import.meta.url));
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirectory),
  filename: (_req, file, cb) => {
    const extension = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

export const uploadProfile = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!extensionByMime[file.mimetype]) {
      return cb(Object.assign(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'), { status: 400 }));
    }
    cb(null, true);
  }
});
