# Actualización: encuestas familiares

Esta versión reemplaza la puntuación y el ranking por estadísticas de participación.

## Para reemplazar el proyecto completo

1. Conserva una copia de tu Excel actual si ya registraste usuarios o fotos.
2. Reemplaza el repositorio por esta carpeta.
3. Ejecuta `npm install` en `backend` y `frontend`.
4. Copia `backend/.env.example` como `backend/.env`.
5. Inicia ambos proyectos con `npm run dev`.

## Migración del Excel

El archivo incluido ya tiene la estructura nueva:

- `Usuarios` sin columnas de puntos.
- `Pronosticos` con el campo `seleccion`.
- `Partidos` con zona horaria y referencias de llaves.

Si tu Excel actual contiene usuarios reales, copia sus filas a la hoja `Usuarios` del archivo nuevo respetando los encabezados. Las fotos siguen almacenándose en `backend/uploads/perfiles/`.

## Archivos obsoletos

Estos archivos ya no forman parte de la versión nueva:

- `frontend/src/pages/RankingPage.jsx`
- `backend/src/services/scoringService.js`
