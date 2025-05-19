import sql from 'mssql';

const dbConfig = {
  server: '161.132.55.86',
  user: 'NVS',
  password: '@Vishe1234',
  database: 'BD_NA_VISHE_PRUEBAS',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

export const handler = async (event) => {
  console.log("Método:", event.httpMethod);

  // Validar que el método sea GET
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

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT id_trabajador, correo, rol, fecha_registro, nombre 
      FROM t_trabajador
    `);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify(result.recordset)
    };

  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
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
  }
};
