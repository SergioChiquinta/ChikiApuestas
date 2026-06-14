CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'participante',
  foto_perfil_url TEXT NOT NULL DEFAULT '',
  foto_perfil_public_id TEXT NOT NULL DEFAULT '',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'participante'))
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT NOT NULL DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil_public_id TEXT NOT NULL DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_username_lower ON usuarios (LOWER(username));

CREATE TABLE IF NOT EXISTS partidos (
  id TEXT PRIMARY KEY,
  fase TEXT NOT NULL DEFAULT '',
  grupo TEXT NOT NULL DEFAULT '',
  fecha DATE,
  hora_local TIME WITHOUT TIME ZONE,
  local TEXT NOT NULL DEFAULT '',
  visitante TEXT NOT NULL DEFAULT '',
  estadio TEXT NOT NULL DEFAULT '',
  ciudad TEXT NOT NULL DEFAULT '',
  goles_local INTEGER NOT NULL DEFAULT 0,
  goles_visitante INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fuente TEXT NOT NULL DEFAULT '',
  zona_horaria TEXT NOT NULL DEFAULT 'America/Lima',
  origen_local TEXT NOT NULL DEFAULT '',
  origen_visitante TEXT NOT NULL DEFAULT '',
  ganador_desempate TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT partidos_estado_check CHECK (estado IN ('pendiente', 'cerrado', 'finalizado')),
  CONSTRAINT partidos_goles_local_check CHECK (goles_local BETWEEN 0 AND 30),
  CONSTRAINT partidos_goles_visitante_check CHECK (goles_visitante BETWEEN 0 AND 30)
);

ALTER TABLE partidos ADD COLUMN IF NOT EXISTS fase TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS grupo TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS fecha DATE;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS hora_local TIME WITHOUT TIME ZONE;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS local TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS visitante TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS estadio TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS ciudad TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS goles_local INTEGER NOT NULL DEFAULT 0;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS goles_visitante INTEGER NOT NULL DEFAULT 0;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS fuente TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS zona_horaria TEXT NOT NULL DEFAULT 'America/Lima';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS origen_local TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS origen_visitante TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS ganador_desempate TEXT NOT NULL DEFAULT '';
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS elecciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  usuario_id TEXT NOT NULL,
  partido_id TEXT NOT NULL,
  eleccion TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT elecciones_valor_check CHECK (eleccion IN ('local', 'empate', 'visitante'))
);

ALTER TABLE elecciones ADD COLUMN IF NOT EXISTS eleccion TEXT;
ALTER TABLE elecciones ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE elecciones ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS ux_elecciones_usuario_partido
  ON elecciones (usuario_id, partido_id);
CREATE INDEX IF NOT EXISTS ix_elecciones_partido ON elecciones (partido_id);
CREATE INDEX IF NOT EXISTS ix_elecciones_usuario ON elecciones (usuario_id);

CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  usuario_id TEXT,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id TEXT NOT NULL DEFAULT '',
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auditoria ADD COLUMN IF NOT EXISTS entidad_id TEXT NOT NULL DEFAULT '';
ALTER TABLE auditoria ADD COLUMN IF NOT EXISTS fecha TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS ix_auditoria_fecha ON auditoria (fecha DESC);

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidad con intentos anteriores de la migración.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
      AND column_name = 'foto_perfil'
  ) THEN
    EXECUTE $copy$
      UPDATE usuarios
      SET foto_perfil_url = COALESCE(NULLIF(foto_perfil_url, ''), foto_perfil, '')
      WHERE COALESCE(foto_perfil_url, '') = ''
    $copy$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'elecciones'
      AND column_name = 'seleccion'
  ) THEN
    EXECUTE $copy$
      UPDATE elecciones
      SET eleccion = seleccion
      WHERE eleccion IS NULL OR eleccion = ''
    $copy$;
  END IF;
END $$;
