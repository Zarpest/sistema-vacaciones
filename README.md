# Sistema de Gestión de Vacaciones y Permisos

Aplicación web para gestionar solicitudes de vacaciones y permisos en una empresa.

## Características

- **Para Empleados**:
  - Solicitud de vacaciones y permisos especiales
  - Visualización de días disponibles
  - Historial de solicitudes
  - Contador de permisos especiales usados

- **Para Jefes**:
  - Aprobación/rechazo de solicitudes
  - Visualización del calendario de vacaciones del equipo
  - Dashboard con solicitudes pendientes

- **Funcionalidades Generales**:
  - Sistema de notificaciones
  - Cálculo automático de días disponibles
  - Sincronización con planillas externas (Google Sheets)

## Tecnologías Utilizadas

- **Frontend**: React, React Router, Axios, TailwindCSS
- **Backend**: Node.js, Express.js
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT
- **Integraciones**: Google Sheets API (opcional)

## Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistema-vacaciones.git
cd sistema-vacaciones
```

### 2. Configurar la base de datos

1. Crear una base de datos en PostgreSQL:

```bash
createdb vacation_system
```

2. Ejecutar el script SQL para crear las tablas:

```bash
psql vacation_system < backend/db/schema.sql
```

### 3. Configurar variables de entorno

1. En el directorio `backend`, crea un archivo `.env` con la siguiente estructura:

```
PORT=5000
DB_USER=tu_usuario_postgres
DB_HOST=localhost
DB_NAME=vacation_system
DB_PASSWORD=tu_contraseña_postgres
DB_PORT=5432
JWT_SECRET=un_secreto_seguro_para_jwt
```

2. En el directorio `frontend`, crea un archivo `.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Instalar dependencias

Para el backend:

```bash
cd backend
npm install
```

Para el frontend:

```bash
cd frontend
npm install
```

### 5. Iniciar la aplicación

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Uso Inicial

### Crear Usuario Administrador

Ejecuta el siguiente script para crear un usuario administrador:

```bash
cd backend
node scripts/create-admin.js
```

Esto creará un usuario con las siguientes credenciales:
- Email: admin@empresa.com
- Contraseña: admin123

### Sincronización con Google Sheets (Opcional)

Para sincronizar los días de vacaciones desde una hoja de cálculo:

1. Configura las credenciales de Google API en el archivo `.env` del backend
2. En la aplicación, ve a la sección de administración y configura el ID de la hoja de cálculo
3. La estructura de la hoja debe tener las siguientes columnas:
   - Email del empleado
   - Nombre
   - Días de vacaciones asignados

## Estructura del Proyecto

```
vacation-management-system/
├── frontend/                 # Aplicación React
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/            # Páginas principales
│   │   │   ├── employee/     # Interfaz de empleados
│   │   │   └── manager/      # Interfaz de jefes
│   │   ├── services/         # Servicios API 
│   │   ├── context/          # Estado global
│   │   ├── utils/            # Utilidades
│   │   └── App.js            # Componente principal
│   └── package.json
└── backend/                  # Servidor Node.js/Express
    ├── config/               # Configuración
    ├── controllers/          # Controladores
    ├── models/               # Modelos de datos
    ├── routes/               # Rutas API
    ├── services/             # Servicios (Google Sheets, Email)
    ├── middleware/           # Middleware (autenticación)
    ├── db/                   # Migrations y seeds
    ├── app.js                # Aplicación Express
    └── package.json
```

## Personalización

### Días de Vacaciones por Defecto

Puedes modificar los días de vacaciones por defecto en la tabla `configuracion` de la base de datos:

```sql
UPDATE configuracion 
SET valor = '25' 
WHERE clave = 'dias_vacaciones_default';
```

### Integración con Sistema de Email

Para habilitar notificaciones por email, configura los parámetros SMTP en el archivo `.env` del backend:

```
SMTP_HOST=smtp.tudominio.com
SMTP_PORT=587
SMTP_USER=notificaciones@tudominio.com
SMTP_PASS=tu_contraseña
```

## Licencia

Este proyecto está licenciado bajo MIT License.
