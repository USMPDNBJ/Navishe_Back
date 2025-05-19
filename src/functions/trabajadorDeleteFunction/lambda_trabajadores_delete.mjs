import sql from 'mssql';

const dbConfig = {
  server: '161.132.55.86',
  user: 'NVS',
  password: '@Vishe1234',
  database: 'BD_NA_VISHE_PRUEBAS',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export const lambdaHandler = async (event, context) => {
  let pool;
  try {
    // Parse the event body
    const body = JSON.parse(event.body || '{}');
    const id_trabajador = body.id_trabajador;

    // Validate input
    if (!id_trabajador) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'id_trabajador is required',
        }),
      };
    }

    // Connect to the database
    pool = await sql.connect(dbConfig);

    // Execute the delete query
    const result = await pool
      .request()
      .input('id_trabajador', sql.Int, id_trabajador)
      .query('DELETE FROM t_trabajador WHERE id_trabajador = @id_trabajador');

    // Check if a record was deleted
    if (result.rowsAffected[0] === 0) {
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
        "Access-Control-Allow-Origin": "*",  // Habilitar CORS
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Métodos permitidos
        "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
      },
      body: JSON.stringify({
        message: 'Worker deleted successfully',
      }),
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: err.message,
      }),
    };
  } finally {
    // Close the database connection
    if (pool) {
      await pool.close();
    }
  }
};