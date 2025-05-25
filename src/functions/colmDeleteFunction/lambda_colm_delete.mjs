import mysql from 'mysql2/promise';

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };

  try {
    const id_colmena = event.pathParameters?.id;

    if (!id_colmena) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'id_colmena es obligatorio' }),
      };
    }

    // Mover la configuración fuera del handler o usar variables de entorno
    const dbConfig = {
      host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
      user: 'admin',
      password: 'Vishe-1234',
      database: 'bd-na-vishe-test',
    };

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      
      const [result] = await connection.execute(
        'DELETE FROM t_colmena WHERE id_colmena = ?',
        [id_colmena]
      );

      if (result.affectedRows === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Colmena no encontrada' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Colmena eliminada exitosamente',
          id_colmena,
        }),
      };
    } finally {
      if (connection) await connection.end();
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Error interno: ${error.message}` }),
    };
  }
};