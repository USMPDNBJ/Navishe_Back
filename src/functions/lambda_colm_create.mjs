import sql from 'mssql';

export const handler = async (event) => {
  try {
    // Configuración de conexión a MSSQL
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

    // Obtener parámetros del evento
    const body = JSON.parse(event.body || '{}');
    const { nombre, fecha_instalacion, imagen_url, id_sensores } = body;

    // Validar parámetros requeridos
    if (!nombre || !fecha_instalacion) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'nombre y fecha_instalacion son obligatorios' }),
      };
    }

    // Conectar a la base de datos
    const pool = await sql.connect(dbConfig);

    // Insertar nueva colmena (sin id_colmena, ya que es automático)
    const query = `
      INSERT INTO t_colmena (nombre, fecha_instalacion, imagen_url, id_sensores)
      OUTPUT INSERTED.id_colmena
      VALUES (@nombre, @fecha_instalacion, @imagen_url, @id_sensores)
    `;
    const request = pool.request()
      .input('nombre', sql.VarChar(100), nombre)
      .input('fecha_instalacion', sql.Date, fecha_instalacion)
      .input('imagen_url', sql.VarChar(255), imagen_url)
      .input('id_sensores', sql.VarChar(100), id_sensores);

    const result = await request.query(query);

    // Obtener el id_colmena generado automáticamente
    const id_colmena = result.recordset[0].id_colmena;

    // Cerrar conexión
    await pool.close();

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Habilitar CORS
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Métodos permitidos
        "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
      },
      body: JSON.stringify({
        message: 'Colmena creada exitosamente',
        id_colmena,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error: ${error.message}` }),
    };
  }
};