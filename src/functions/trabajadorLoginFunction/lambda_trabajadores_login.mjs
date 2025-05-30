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

// Creamos un pool de conexiones
const pool = mysql.createPool(dbConfig);

export const handler = async (event) => {
  console.log("Método:", event.httpMethod);

  // Validar CORS para solicitudes OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({})
    };
  }

  // Validar que el método sea POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  let connection;
  try {
    const body = JSON.parse(event.body || '{}');
    const { correo, contrasena } = body;

    if (!correo || !contrasena) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ message: 'Faltan campos requeridos: correo o contraseña' })
      };
    }

    // Obtenemos una conexión del pool
    connection = await pool.getConnection();
    
    // Ejecutamos la consulta con parámetros escapados para seguridad
    const [rows] = await connection.execute(
      `SELECT rol FROM t_trabajador 
       WHERE correo = ? AND contrasena = ?`,
      [correo, contrasena]
    );

    if (rows.length === 0) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ message: 'Credenciales incorrectas' })
      };
    }

    const { rol } = rows[0];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ rol })
    };

  } catch (error) {
    console.error('Error durante el login:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({
        message: 'Error interno al validar login',
        error: error.message
      })
    };
  } finally {
    // Liberamos la conexión de vuelta al pool
    if (connection) connection.release();
  }
};