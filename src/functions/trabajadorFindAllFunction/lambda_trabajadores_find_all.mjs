import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export const handler = async (event) => {
  console.log('Evento recibido:', JSON.stringify(event, null, 2));
  
  // Manejo de CORS para OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    console.log('Procesando solicitud OPTIONS');
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({})
    };
  }

  // Validar método HTTP
  if (event.httpMethod !== 'GET') {
    console.log(`Método no permitido: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ 
        message: 'Método no permitido',
        receivedMethod: event.httpMethod,
        expectedMethod: 'GET'
      })
    };
  }

  let connection;
  try {
    console.log('Conectando a la base de datos...');
    connection = await pool.getConnection();
    
    console.log('Ejecutando consulta...');
    const [rows] = await connection.query(`
      SELECT 
        id_trabajador,
        fecha_registro,
        correo,
        nombre,
        rol,
        status,
        dni
      FROM t_trabajador
    `);

    console.log(`Resultados obtenidos: ${rows.length} registros`);
    
    const trabajadores = rows.map(row => ({
      id: row.id_trabajador,
      fechaRegistro: row.fecha_registro,
      correo: row.correo,
      nombre: row.nombre,
      rol: row.rol,
      estado: row.status === 1 ? 'ACTIVO' : (row.status === 2 ? 'INACTIVO' : 'DESCONOCIDO'),
      dni: row.dni
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify(trabajadores)
    };

  } catch (error) {
    console.error('Error en la ejecución:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ 
        message: 'Error al obtener trabajadores', 
        error: error.message 
      })
    };
  } finally {
    if (connection) {
      console.log('Liberando conexión...');
      connection.release();
    }
  }
};