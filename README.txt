AJUSTE PARA EL ESQUEMA NUMERICO DE NEON

Reemplaza estos archivos dentro de tu proyecto:
- backend/scripts/importExcelToPostgres.js
- backend/src/repositories/userRepository.js
- backend/src/repositories/choiceRepository.js
- backend/src/repositories/matchRepository.js
- backend/src/repositories/auditRepository.js

No ejecutes runMigrations.js con el schema.sql anterior del parche, porque ese schema usa IDs TEXT y columnas diferentes.
Tu esquema actual usa BIGSERIAL/INTEGER y debe conservarse.

Después ejecuta desde backend:
  node --check scripts/importExcelToPostgres.js
  node scripts/importExcelToPostgres.js
  node scripts/migrateProfilePhotosToCloudinary.js
  node scripts/verifyServices.js
  npm run dev

La hoja Config se omite porque el esquema entregado no tiene tabla configuracion.
