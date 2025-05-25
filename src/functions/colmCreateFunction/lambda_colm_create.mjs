import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
};

const createResponse = (statusCode, body = {}, headers = {}) => ({
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

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const insertQuery = `
      INSERT INTO t_colmena (nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    const [result] = await connection.execute(insertQuery, [
      nombre,
      fecha_instalacion,
      imagen_url,
      id_sensores,
      longitud,
      latitud
    ]);

    return createResponse(200, {
      message: 'Colmena creada exitosamente',
      data: {
        id_colmena: result.insertId,
        nombre,
        fecha_instalacion,
        imagen_url,
        id_sensores,
        longitud,
        latitud
      }
    });

  } catch (err) {
    console.error('ERROR EN HANDLER:', err);
    return createResponse(500, { error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};
