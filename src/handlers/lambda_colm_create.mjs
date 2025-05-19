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

const createResponse = (statusCode, headers, body = {}) => ({
  statusCode,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  },
  body: JSON.stringify(body)
});

export const handler = async (event) => {
  if (!event) {
    return createResponse(400, { message: 'No se recibieron datos para crear la colmena.' });
  }

  const { nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud } = event;

  if (!nombre || !fecha_instalacion || !id_sensores || !imagen_url || longitud === undefined || latitud === undefined) {
    return createResponse(400, { message: 'Faltan campos obligatorios en los datos de la colmena.' });
  }

  let pool;
  try {
    pool = await sql.connect(dbConfig);

    const insertQuery = `
      INSERT INTO t_colmena (nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud)
      OUTPUT inserted.*
      VALUES (@nombre, @fecha_instalacion, @imagen_url, @id_sensores, @longitud, @latitud);
    `;
    const request = pool.request();
    const result = await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('fecha_instalacion', sql.DateTime, fecha_instalacion)
      .input('imagen_url', sql.NVarChar, imagen_url)
      .input('id_sensores', sql.NVarChar, id_sensores)
      .input('longitud', sql.Float, longitud)
      .input('latitud', sql.Float, latitud)
      .query(insertQuery);
    return createResponse(200, {}, {
      message: 'Colmena creada exitosamente',
      data: result.recordset
    }
    );


  } catch (err) {
    console.error('ERROR EN HANDLER:', err); // 👈 esto imprime el verdadero problema
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }) // 👈 nota que antes decía error.message pero deberías capturar "err"
    };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.err('Error al cerrar la conexión:', err);
      }
    }
  }
};