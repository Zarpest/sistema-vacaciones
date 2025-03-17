-- Tabla de usuarios (empleados y jefes)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('empleado', 'jefe', 'admin')),
  jefe_id INT REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vacaciones anuales asignadas
CREATE TABLE vacaciones_anuales (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  año INT NOT NULL,
  dias_asignados INT NOT NULL DEFAULT 22,
  dias_adicionales INT DEFAULT 0,
  dias_usados INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, año)
);

-- Tabla de permisos especiales
CREATE TABLE permisos_especiales (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  año INT NOT NULL,
  horas_disponibles INT NOT NULL DEFAULT 24, -- 24 horas (3 días) por defecto
  horas_usadas INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, año)
);

-- Tabla de solicitudes (vacaciones y permisos)
CREATE TABLE solicitudes (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('vacaciones', 'permiso_especial')),
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  dias NUMERIC(5,2), -- Para vacaciones (puede incluir medio día)
  horas NUMERIC(5,2), -- Para permisos especiales
  motivo VARCHAR(500),
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' 
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  comentario_respuesta TEXT,
  aprobado_por INT REFERENCES usuarios(id),
  fecha_respuesta TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- No puede haber solicitudes con fechas que se solapen para el mismo usuario
  CONSTRAINT no_overlap CHECK (
    NOT EXISTS (
      SELECT 1 FROM solicitudes s
      WHERE s.id != id AND s.usuario_id = usuario_id AND 
      s.estado != 'rechazado' AND
      (fecha_inicio, fecha_fin) OVERLAPS (s.fecha_inicio, s.fecha_fin)
    )
  )
);

-- Tabla para festividades y días no laborables
CREATE TABLE dias_no_laborables (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fecha)
);

-- Tabla para configuración general del sistema
CREATE TABLE configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para registrar notificaciones
CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de consultas frecuentes
CREATE INDEX idx_solicitudes_usuario ON solicitudes(usuario_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_jefe ON solicitudes(aprobado_por);
CREATE INDEX idx_usuarios_jefe ON usuarios(jefe_id);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);

-- Insertar datos de configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('dias_vacaciones_default', '22', 'Días de vacaciones anuales por defecto'),
('horas_permisos_default', '24', 'Horas de permisos especiales anuales por defecto'),
('min_dias_solicitud', '7', 'Días mínimos de antelación para solicitar vacaciones'),
('google_sheets_id', '', 'ID de la hoja de Google Sheets para sincronización');
