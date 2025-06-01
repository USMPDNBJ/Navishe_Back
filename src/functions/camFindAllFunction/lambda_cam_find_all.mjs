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

export async function camFindAllHandler(event, injectedPool = pool) {
  console.log('Evento recibido:', JSON.stringify(event, null, 2));

  // Manejo de CORS para OPTIONS
  if (event.httpMethod === 'OPTIONS') {
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
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  let connection;
  try {
    connection = await injectedPool.getConnection();
    
    // Consulta para obtener todas las cámaras
    const [cameras] = await connection.query(`
      SELECT id, nombre, url_camera 
      FROM t_camera
      ORDER BY id
    `);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify(cameras)
    };

  } catch (error) {
    console.error('Error al obtener cámaras:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ 
        message: 'Error al obtener cámaras', 
        error: error.message 
      })
    };
  } finally {
    if (connection) connection.release();
  }
}

export const handler = camFindAllHandler;