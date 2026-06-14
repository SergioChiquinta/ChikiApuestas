import cloudinary from '../config/cloudinary.js';

const PROFILE_FOLDER = process.env.CLOUDINARY_PROFILE_FOLDER || 'chiki-mundial';

function safePublicId(value) {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function uploadProfileImage(buffer, userId) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw Object.assign(new Error('La imagen recibida está vacía.'), { status: 400 });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: PROFILE_FOLDER,
        public_id: `perfil-${safePublicId(userId)}`,
        overwrite: true,
        invalidate: true,
        unique_filename: false,
        transformation: [
          { width: 512, height: 512, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(
            Object.assign(new Error('Cloudinary no pudo guardar la imagen.'), {
              status: 502,
              cause: error
            })
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(buffer);
  });
}
