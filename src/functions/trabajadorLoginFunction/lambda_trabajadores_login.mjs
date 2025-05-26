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

  const body = JSON.parse(event.body || '{}');
  const { correo, contrasena } = body;

  if (!correo || !contrasena) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Faltan campos requeridos: correo o contraseña' })
    };
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('correo', sql.VarChar, correo)
      .input('contrasena', sql.VarChar, contrasena)
      .query(`
        SELECT rol FROM t_trabajador
        WHERE correo = @correo AND contrasena = @contrasena
      `);

    if (result.recordset.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Credenciales incorrectas' })
      };
    }

    const { rol } = result.recordset[0];

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Habilitar CORS
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Métodos permitidos
        "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
      },
      body: JSON.stringify({ rol })
    };

  } catch (error) {
    console.error('Error durante el login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error interno al validar login',
        error: error.message
      })
    };
  }
};
