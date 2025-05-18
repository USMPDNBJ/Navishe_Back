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


  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT id_trabajador, correo, rol, fecha_registro, nombre 
      FROM t_trabajador
    `);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Habilitar CORS
        "Access-Control-Allow-Methods": "GET, OPTIONS", // Métodos permitidos
        "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
      },
      body: JSON.stringify(result.recordset)
    };

  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error al obtener trabajadores', 
        error: error.message 
      })
    };
  }
};
