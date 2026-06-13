# ChikiPronósticos

Quiniela familiar privada para el Mundial 2026 basada en **puntos virtuales**. No incluye dinero, saldos, pagos, premios, cuotas ni retiros.

## Funciones

- Inicio de sesión con JWT.
- Roles `admin` y `participante`.
- Calendario de 104 partidos del Mundial 2026.
- Pronóstico de marcador mientras el partido está `pendiente`.
- Puntuación: 3 puntos por marcador exacto, 1 por acertar ganador/empate y 0 en otro caso.
- Ranking familiar.
- Administración de usuarios y resultados.
- Perfil con cambio de nombre, contraseña y foto.
- Excel como almacenamiento para un grupo pequeño.
- Copia de seguridad antes de cada escritura del Excel.

## Credenciales iniciales

- Admin: `admin` / `Admin123!`
- Participante demo: `sergio` / `Familia123!`

Cambia ambas contraseñas al iniciar.

## Instalación

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:4000`

### Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Web: `http://localhost:5173`

## Estructura

```text
chiki-pronosticos/
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ auth/
│  │  ├─ components/
│  │  ├─ pages/
│  │  └─ styles/
│  └─ package.json
├─ backend/
│  ├─ data/
│  │  ├─ chiki_pronosticos.xlsx
│  │  └─ fixtures_mundial_2026.json
│  ├─ uploads/perfiles/
│  ├─ backups/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  └─ services/
│  ├─ .env.example
│  └─ package.json
└─ README.md
```

## Hojas del Excel

- `Usuarios`: credenciales hash, rol, puntos y ruta de foto.
- `Partidos`: calendario, marcador y estado.
- `Pronosticos`: selección de cada participante.
- `Config`: reglas de puntuación.
- `Auditoria`: reservada para registrar acciones administrativas.

## Nota sobre Excel

El archivo XLSX funciona para una familia o grupo pequeño. No debe abrirse en Excel mientras el servidor está escribiendo. Para uso público o muchos usuarios, migra a SQLite, PostgreSQL o MySQL.

## Solución del error 401 al iniciar sesión

Si las cuentas iniciales no aceptan sus contraseñas, ejecuta desde `backend`:

```powershell
npm run reset:seed-passwords
```

Después reinicia el backend y elimina el token anterior del navegador:

```js
localStorage.removeItem('token')
```

Las credenciales restauradas son `admin / Admin123!` y `sergio / Familia123!`.

## Fotos de perfil

Las imágenes se almacenan físicamente en `backend/uploads/perfiles/` y el Excel guarda únicamente la ruta pública. Formatos permitidos: JPG, PNG y WEBP, con un tamaño máximo de 2 MB.

Para que las imágenes funcionen, inicia el backend desde su propia carpeta:

```powershell
cd backend
npm run dev
```

No mantengas abierto `backend/data/chiki_pronosticos.xlsx` en Microsoft Excel mientras la aplicación guarda cambios. Si está bloqueado, la API devolverá un error 409 sin detenerse.
