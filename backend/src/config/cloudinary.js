import { v2 as cloudinary } from 'cloudinary';

const requiredVariables = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]);
if (missingVariables.length) {
  throw new Error(`Faltan variables de Cloudinary: ${missingVariables.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;
