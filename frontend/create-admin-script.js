// backend/scripts/create-admin.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('Creando usuario administrador...');
    
    // Verificar si ya existe un administrador
    const checkResult = await client.query(
      'SELECT * FROM usuarios WHERE rol = $1 LIMIT 1',
      ['admin']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('¡Ya existe un usuario administrador!');
      console.log(`Email: ${checkResult.rows[0].email}`);
      return;
    }
    
    // Crear el usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const insertResult = await client.query(
      `INSERT INTO usuarios 
       (email, password, nombre, apellido, rol) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email`,
      ['admin@empresa.com', hashedPassword, 'Administrador', 'Sistema', 'admin']
    );
    
    const admin = insertResult.rows[0];
    
    console.log('¡Usuario administrador creado con éxito!');
    console.log('-------------------------------------');
    console.log('Email: admin@empresa.com');
    console.log('Contraseña: admin123');
    console.log('-------------------------------------');
    console.log('¡Recuerde cambiar esta contraseña después del primer inicio de sesión!');
    
    // Crear registros de vacaciones y permisos para el administrador
    const currentYear = new Date().getFullYear();
    
    await client.query(
      `INSERT INTO vacaciones_anuales 
       (usuario_id, año, dias_asignados) 
       VALUES ($1, $2, $3)`,
      [admin.id, currentYear, 30]
    );
    
    await client.query(
      `INSERT INTO permisos_especiales 
       (usuario_id, año, horas_disponibles) 
       VALUES ($1, $2, $3)`,
      [admin.id, currentYear, 24]
    );
    
  } catch (err) {
    console.error('Error al crear el usuario administrador:', err);
  } finally {
    client.release();
    // Cerrar la conexión a la base de datos
    pool.end();
  }
}

createAdmin();
