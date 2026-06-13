# ChikiMundial

Aplicación familiar privada para seguir el Mundial 2026 mediante encuestas sociales. Cada participante puede elegir al equipo que apoya o marcar empate. La aplicación no incluye pagos, premios, cuotas ni clasificación por aciertos.

## Cambios incluidos

- Elecciones simples: equipo local, empate o equipo visitante.
- Calendario mostrado en hora de Lima, Perú.
- Banderas y tarjetas mejoradas para cada partido.
- Modal para consultar las elecciones de todos los participantes; quien aún no respondió aparece como `-- --`.
- Notificaciones tipo toast para inicio de sesión, guardado, actualización y errores.
- Bloqueo automático de la encuesta al llegar la hora de inicio del partido.
- Bloqueo adicional por estado `cerrado` o `finalizado`.
- Estadísticas de participación, sin puntos ni orden por aciertos.
- Administración manual de equipos, resultados y estados.
- Avance automático de ganadores y perdedores en las llaves eliminatorias.
- Perfil con nombre, contraseña y foto.
- Excel como almacenamiento para un grupo familiar pequeño.
- Copia de seguridad antes de cada escritura del Excel.

## Credenciales iniciales

- Administrador: `admin` / `Admin123!`
- Participante de prueba: `sergio` / `Familia123!`

Cambia las contraseñas después del primer inicio de sesión.

## Instalación

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

En Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
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

En Windows PowerShell:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Web: `http://localhost:5173`

## Flujo de las encuestas

1. El participante abre **Mis elecciones**.
2. Selecciona al equipo local, empate o equipo visitante.
3. Guarda o modifica la elección mientras el partido siga disponible.
4. Al llegar la hora de inicio, el frontend y el backend bloquean cambios.
5. El botón **Ver elecciones familiares** muestra las respuestas de todos los participantes.
6. La vista **Participación** solo indica cuántas encuestas completó cada persona.

## Administración de resultados y llaves

El administrador puede editar equipos, marcador y estado. En partidos eliminatorios que terminan empatados debe indicar qué equipo clasificó.

Los campos `origen_local` y `origen_visitante` del Excel conservan referencias como `Ganador del Partido 89`. Al finalizar el partido anterior, el backend actualiza automáticamente el equipo de la siguiente ronda. También se actualizan los perdedores para el partido por el tercer puesto.

La asignación inicial desde los grupos hacia la Ronda de 32 puede hacerse manualmente desde **Administrar partidos** cuando estén definidos los clasificados. Desde la Ronda de 32 en adelante, las referencias entre partidos se actualizan automáticamente.

## Hojas del Excel

- `Usuarios`: credenciales, rol, foto y estado.
- `Partidos`: calendario, marcador, estado, zona horaria y referencias de las llaves.
- `Pronosticos`: conserva el nombre anterior por compatibilidad, pero almacena elecciones `local`, `empate` o `visitante`, sin puntajes.
- `Config`: reglas de funcionamiento de las encuestas.
- `Auditoria`: cambios administrativos de partidos.

## Campos añadidos en `Partidos`

- `zona_horaria`: zona IANA de la ciudad anfitriona.
- `origen_local`: origen permanente del equipo local.
- `origen_visitante`: origen permanente del equipo visitante.
- `ganador_desempate`: `local` o `visitante` cuando un empate eliminatorio se resuelve por prórroga o penales.

## Nota sobre fechas

El Excel conserva la fecha y hora local de la sede. El backend convierte ese instante a `America/Lima` y devuelve `fecha_lima`, `hora_lima`, `inicio_iso` y `bloqueado`.

## Nota sobre Excel

No mantengas abierto `backend/data/chiki_pronosticos.xlsx` en Microsoft Excel mientras la aplicación guarda cambios. Windows puede bloquear el archivo y la API devolverá un error 409.

## Restablecer cuentas iniciales

Desde `backend`:

```bash
npm run reset:seed-passwords
```

Después reinicia el backend y elimina el token anterior del navegador:

```js
localStorage.removeItem('token');
```
