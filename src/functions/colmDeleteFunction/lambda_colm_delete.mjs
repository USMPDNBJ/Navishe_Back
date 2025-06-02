export const handler = async (event) => {
  const mysql = await import('mysql2/promise'); // Import dinámico para permitir el mock en tests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  let connection
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

    connection = await mysql.default.createConnection(dbConfig);

    console.log(id_colmena)
    const [result] = await connection.execute(
      'DELETE FROM t_colmena WHERE id_colmena = ?',
      [id_colmena]
    );

    console.log(result);

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

  } catch (error) {
    console.error('Error en la ejecución SQL:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' }),
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error cerrando conexión:', endError);
      }
    }
  }
};