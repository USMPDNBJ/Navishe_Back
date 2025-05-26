import { createConnection } from 'mysql2/promise';

const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
  port: 3306,
};

export const handler = async (event, context) => {
  let connection;
  try {
    const body = JSON.parse(event.body || '{}');
    const { id_trabajador } = body;

    if (!id_trabajador) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'id_trabajador is required',
        }),
      };
    }

    connection = await createConnection(dbConfig);

    let result;
    try {
      const execResult = await connection.execute(
        'DELETE FROM t_trabajador WHERE id_trabajador = ?',
        [id_trabajador]
      );
      result = execResult && execResult[0];
    } catch (err) {
      console.error('ERROR EN CATCH INTERNO:', err); // <-- Log para depuración
      throw err;
    }

    if (!result || typeof result.affectedRows !== 'number') {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Worker not found',
        }),
      };
    }

    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Worker not found',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({
        message: 'Worker deleted successfully',
      }),
    };
  } catch (err) {
    console.error('ERROR EN CATCH:', err); // <-- Log para depuración
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: err.message,
      }),
    };
  } finally {
    // Cerrar conexión solo si fue creada
    if (connection) {
      try {
        await connection.end();
      } catch (closeErr) {
        console.error('Error closing DB connection:', closeErr);
      }
    }
  }
};
