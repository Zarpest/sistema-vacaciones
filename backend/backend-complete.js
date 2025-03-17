// backend/app.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acceso no autorizado' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Middleware de autorización para roles
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next();
  };
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    
    const user = userResult.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        nombre: user.nombre, 
        apellido: user.apellido,
        rol: user.rol,
        jefe_id: user.jefe_id
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({ token, user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// API para obtener información del usuario actual
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, nombre, apellido, rol, jefe_id FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Obtener información de vacaciones para el año actual
    const year = new Date().getFullYear();
    const vacacionesResult = await pool.query(
      'SELECT * FROM vacaciones_anuales WHERE usuario_id = $1 AND año = $2',
      [req.user.id, year]
    );
    
    // Obtener información de permisos especiales
    const permisosResult = await pool.query(
      'SELECT * FROM permisos_especiales WHERE usuario_id = $1 AND año = $2',
      [req.user.id, year]
    );
    
    const vacaciones = vacacionesResult.rows[0] || {
      dias_asignados: 22,
      dias_adicionales: 0,
      dias_usados: 0
    };
    
    const permisos = permisosResult.rows[0] || {
      horas_disponibles: 24,
      horas_usadas: 0
    };
    
    res.json({
      usuario: user,
      vacaciones,
      permisos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Solicitudes de vacaciones y permisos
app.post('/api/solicitudes', authenticateToken, async (req, res) => {
  const { tipo, fecha_inicio, fecha_fin, dias, horas, motivo } = req.body;
  const userId = req.user.id;
  
  // Iniciar una transacción
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar si hay suficientes días/horas disponibles
    const year = new Date(fecha_inicio).getFullYear();
    
    if (tipo === 'vacaciones') {
      const vacacionesResult = await client.query(
        'SELECT * FROM vacaciones_anuales WHERE usuario_id = $1 AND año = $2',
        [userId, year]
      );
      
      let vacaciones;
      
      if (vacacionesResult.rows.length === 0) {
        // Crear registro para el año actual
        const defaultDiasResult = await client.query(
          'SELECT valor FROM configuracion WHERE clave = $1',
          ['dias_vacaciones_default']
        );
        
        const diasDefault = parseInt(defaultDiasResult.rows[0]?.valor || '22');
        
        const newVacacionesResult = await client.query(
          `INSERT INTO vacaciones_anuales 
           (usuario_id, año, dias_asignados, dias_adicionales, dias_usados) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [userId, year, diasDefault, 0, 0]
        );
        
        vacaciones = newVacacionesResult.rows[0];
      } else {
        vacaciones = vacacionesResult.rows[0];
      }
      
      const diasDisponibles = vacaciones.dias_asignados + vacaciones.dias_adicionales - vacaciones.dias_usados;
      
      if (dias > diasDisponibles) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `No tiene suficientes días de vacaciones. Disponibles: ${diasDisponibles}, Solicitados: ${dias}` 
        });
      }
    } else if (tipo === 'permiso_especial') {
      const permisosResult = await client.query(
        'SELECT * FROM permisos_especiales WHERE usuario_id = $1 AND año = $2',
        [userId, year]
      );
      
      let permisos;
      
      if (permisosResult.rows.length === 0) {
        // Crear registro para el año actual
        const defaultHorasResult = await client.query(
          'SELECT valor FROM configuracion WHERE clave = $1',
          ['horas_permisos_default']
        );
        
        const horasDefault = parseInt(defaultHorasResult.rows[0]?.valor || '24');
        
        const newPermisosResult = await client.query(
          `INSERT INTO permisos_especiales 
           (usuario_id, año, horas_disponibles, horas_usadas) 
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [userId, year, horasDefault, 0]
        );
        
        permisos = newPermisosResult.rows[0];
      } else {
        permisos = permisosResult.rows[0];
      }
      
      const horasDisponibles = permisos.horas_disponibles - permisos.horas_usadas;
      
      if (horas > horasDisponibles) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `No tiene suficientes horas de permiso. Disponibles: ${horasDisponibles}, Solicitadas: ${horas}` 
        });
      }
    }
    
    // Insertar la solicitud
    const solicitudResult = await client.query(
      `INSERT INTO solicitudes
       (usuario_id, tipo, fecha_inicio, fecha_fin, dias, horas, motivo, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, tipo, fecha_inicio, fecha_fin, dias, horas, motivo, 'pendiente']
    );
    
    const solicitud = solicitudResult.rows[0];
    
    // Obtener información del jefe para notificación
    const userResult = await client.query(
      'SELECT jefe_id FROM usuarios WHERE id = $1',
      [userId]
    );
    
    const jefeId = userResult.rows[0].jefe_id;
    
    if (jefeId) {
      // Crear notificación para el jefe
      await client.query(
        `INSERT INTO notificaciones
         (usuario_id, tipo, titulo, mensaje)
         VALUES ($1, $2, $3, $4)`,
        [
          jefeId,
          'nueva_solicitud',
          'Nueva solicitud de ' + (tipo === 'vacaciones' ? 'vacaciones' : 'permiso'),
          `El usuario ${req.user.nombre} ${req.user.apellido} ha solicitado ${tipo === 'vacaciones' ? dias + ' días de vacaciones' : horas + ' horas de permiso'} desde ${new Date(fecha_inicio).toLocaleDateString()} hasta ${new Date(fecha_fin).toLocaleDateString()}.`
        ]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(solicitud);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  } finally {
    client.release();
  }
});

// Obtener solicitudes del usuario
app.get('/api/solicitudes/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
        u.nombre as aprobador_nombre, 
        u.apellido as aprobador_apellido
       FROM solicitudes s
       LEFT JOIN usuarios u ON s.aprobado_por = u.id
       WHERE s.usuario_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
});

// Solicitudes pendientes para jefes
app.get('/api/solicitudes/pendientes', authenticateToken, authorize(['jefe', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
        u.nombre as empleado_nombre, 
        u.apellido as empleado_apellido,
        u.email as empleado_email
       FROM solicitudes s
       JOIN usuarios u ON s.usuario_id = u.id
       WHERE u.jefe_id = $1 AND s.estado = 'pendiente'
       ORDER BY s.created_at ASC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las solicitudes pendientes' });
  }
});

// Aprobar/rechazar solicitud
app.put('/api/solicitudes/:id', authenticateToken, authorize(['jefe', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { estado, comentario } = req.body;
  
  if (!['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar que la solicitud existe y es del equipo del jefe
    const solicitudResult = await client.query(
      `SELECT s.*, u.jefe_id, u.nombre, u.apellido, u.email
       FROM solicitudes s
       JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (solicitudResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    const solicitud = solicitudResult.rows[0];
    
    if (solicitud.jefe_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tiene permiso para esta solicitud' });
    }
    
    if (solicitud.estado !== 'pendiente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'La solicitud ya ha sido procesada' });
    }
    
    // Actualizar el estado de la solicitud
    await client.query(
      `UPDATE solicitudes
       SET estado = $1, comentario_respuesta = $2, aprobado_por = $3, fecha_respuesta = NOW()
       WHERE id = $4`,
      [estado, comentario, req.user.id, id]
    );
    
    // Si es aprobada, actualizar los días/horas usados
    if (estado === 'aprobado') {
      const year = new Date(solicitud.fecha_inicio).getFullYear();
      
      if (solicitud.tipo === 'vacaciones') {
        await client.query(
          `UPDATE vacaciones_anuales
           SET dias_usados = dias_usados + $1, updated_at = NOW()
           WHERE usuario_id = $2 AND año = $3`,
          [solicitud.dias, solicitud.usuario_id, year]
        );
      } else if (solicitud.tipo === 'permiso_especial') {
        await client.query(
          `UPDATE permisos_especiales
           SET horas_usadas = horas_usadas + $1, updated_at = NOW()
           WHERE usuario_id = $2 AND año = $3`,
          [solicitud.horas, solicitud.usuario_id, year]
        );
      }
    }
    
    // Crear notificación para el empleado
    await client.query(
      `INSERT INTO notificaciones
       (usuario_id, tipo, titulo, mensaje)
       VALUES ($1, $2, $3, $4)`,
      [
        solicitud.usuario_id,
        estado === 'aprobado' ? 'solicitud_aprobada' : 'solicitud_rechazada',
        `Solicitud de ${solicitud.tipo === 'vacaciones' ? 'vacaciones' : 'permiso'} ${estado}`,
        `Su solicitud de ${solicitud.tipo === 'vacaciones' ? 'vacaciones' : 'permiso'} del ${new Date(solicitud.fecha_inicio).toLocaleDateString()} al ${new Date(solicitud.fecha_fin).toLocaleDateString()} ha sido ${estado}${comentario ? ': ' + comentario : ''}.`
      ]
    );
    
    // Enviar notificación por email
    // Aquí iría el código para enviar un email al empleado
    
    await client.query('COMMIT');
    
    res.json({ success: true, message: `Solicitud ${estado} correctamente` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  } finally {
    client.release();
  }
});

// Obtener calendario de vacaciones del equipo (para jefes)
app.get('/api/calendario/equipo', authenticateToken, authorize(['jefe', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.fecha_inicio, s.fecha_fin, s.tipo,
        u.id as usuario_id, u.nombre, u.apellido
       FROM solicitudes s
       JOIN usuarios u ON s.usuario_id = u.id
       WHERE u.jefe_id = $1 AND s.estado = 'aprobado'
       AND s.fecha_fin >= CURRENT_DATE
       ORDER BY s.fecha_inicio ASC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el calendario' });
  }
});

// Obtener notificaciones no leídas
app.get('/api/notificaciones', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notificaciones
       WHERE usuario_id = $1 AND leida = false
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
});

// Marcar notificación como leída
app.put('/api/notificaciones/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query(
      `UPDATE notificaciones
       SET leida = true
       WHERE id = $1 AND usuario_id = $2`,
      [id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
});

// Sincronización con Google Sheets (opcional)
app.post('/api/sincronizar/planilla', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    // Configuración de acceso a Google Sheets
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Obtener ID de la hoja de cálculo desde la configuración
    const configResult = await pool.query(
      'SELECT valor FROM configuracion WHERE clave = $1',
      ['google_sheets_id']
    );
    
    const spreadsheetId = configResult.rows[0]?.valor;
    
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'ID de Google Sheets no configurado' });
    }
    
    // Leer datos de la hoja de cálculo
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Empleados!A2:C',  // Rango que contiene los datos (A=email, B=nombre, C=dias)
    });
    
    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos en la hoja de cálculo' });
    }
    
    // Actualizar días de vacaciones para cada empleado
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let updated = 0;
      const currentYear = new Date().getFullYear();
      
      for (const row of rows) {
        const [email, nombre, diasStr] = row;
        const dias = parseInt(diasStr);
        
        if (!email || isNaN(dias)) continue;
        
        // Buscar usuario por email
        const userResult = await client.query(
          'SELECT id FROM usuarios WHERE email = $1',
          [email.trim()]
        );
        
        if (userResult.rows.length === 0) continue;
        
        const userId = userResult.rows[0].id;
        
        // Verificar si ya existe un registro para este año
        const vacacionesResult = await client.query(
          'SELECT id FROM vacaciones_anuales WHERE usuario_id = $1 AND año = $2',
          [userId, currentYear]
        );
        
        if (vacacionesResult.rows.length === 0) {
          // Crear nuevo registro
          await client.query(
            `INSERT INTO vacaciones_anuales 
             (usuario_id, año, dias_asignados, dias_adicionales, dias_usados) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, currentYear, dias, 0, 0]
          );
        } else {
          // Actualizar registro existente
          await client.query(
            `UPDATE vacaciones_anuales 
             SET dias_asignados = $1, updated_at = NOW()
             WHERE id = $2`,
            [dias, vacacionesResult.rows[0].id]
          );
        }
        
        updated++;
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: `Sincronización completada. Se actualizaron ${updated} registros.` 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error al sincronizar con Google Sheets:', err);
    res.status(500).json({ error: 'Error al sincronizar con Google Sheets' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

module.exports = app;
