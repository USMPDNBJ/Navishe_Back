// src/functions/colmFindAllFunction/lambda_colm_find_all.mjs
import mysql from 'mysql2/promise';

export const createHandler = (mysqlLib = mysql) => async (event, context) => {
  let connection;

  try {
    connection = await mysqlLib.createConnection({
      host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
      user: 'admin',
      password: 'Vishe-1234',
      database: 'bd-na-vishe-test',
      port: 3306,
    });

    const [rows] = await connection.execute(`
      SELECT 
        id_colmena,
        nombre,
        fecha_instalacion,
        imagen_url,
        id_sensores
      FROM t_colmena
    `);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({
        message: 'Beehives retrieved successfully',
        data: rows,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error retrieving beehives',
        error: err.message,
      }),
    };
  } finally {
    if (connection) await connection.end();
  }
};

// Exportar por defecto para uso normal
export const handler = createHandler();
