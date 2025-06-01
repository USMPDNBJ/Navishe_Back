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

export async function trabajadorUpdateHandler(event, injectedPool = pool) {
  // Validar CORS para solicitudes OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({})
    };
  }

  // Validar que el método sea PUT
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  }

  let connection;
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: "ID de trabajador no proporcionado" })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { correo, nombre, contrasena, rol, status, dni } = body;

    if (!correo || !nombre || !contrasena || !rol || status === undefined || !dni) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: "Faltan campos requeridos" })
      };
    }

    const statusBit = status === 'ACTIVO' || status === '1' || status === 1 ? 1 : 0;
    const fecha_registro = new Date();

    connection = await injectedPool.getConnection();
    const [result] = await connection.execute(
      `UPDATE t_trabajador
       SET correo = ?,
           nombre = ?,
           contrasena = ?,
           rol = ?,
           status = ?,
           dni = ?,
           fecha_registro = ?
       WHERE id_trabajador = ?`,
      [correo, nombre, contrasena, rol, statusBit, dni, fecha_registro, id]
    );

    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ message: "Trabajador no encontrado" })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ message: "Trabajador actualizado correctamente" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ 
        error: "Error interno del servidor",
        details: error.message 
      })
    };
  } finally {
    if (connection) connection.release();
  }
}

export const handler = trabajadorUpdateHandler;