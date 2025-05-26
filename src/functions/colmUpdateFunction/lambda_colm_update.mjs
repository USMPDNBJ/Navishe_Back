import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
};

export const handler = async (event) => {
  try {
    const id_colmena = event.pathParameters?.id;

    if (!id_colmena) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'id_colmena es obligatorio' }),
      };
    }

    let body=event.body;

    const { nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud } = body;

    if (!nombre || !fecha_instalacion || longitud === undefined || latitud === undefined) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: 'nombre, fecha_instalacion, longitud y latitud son obligatorios'
        }),
      };
    }

    const connection = await mysql.createConnection(dbConfig);

    // Ejecutar la actualización
    const updateQuery = `
      UPDATE t_colmena
      SET nombre = ?, fecha_instalacion = ?, imagen_url = ?, id_sensores = ?, longitud = ?, latitud = ?
      WHERE id_colmena = ?;
    `;

    const [updateResult] = await connection.execute(updateQuery, [
      nombre,
      fecha_instalacion,
      imagen_url,
      id_sensores,
      longitud,
      latitud,
      id_colmena
    ]);

    // Si no se actualizó ninguna fila, no existe el registro
    if (updateResult.affectedRows === 0) {
      await connection.end();
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Colmena no encontrada' }),
      };
    }

    // Consultar colmena actualizada
    const [rows] = await connection.execute(
      `SELECT id_colmena, nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud
       FROM t_colmena WHERE id_colmena = ?`,
      [id_colmena]
    );

    await connection.end();

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: 'Colmena actualizada exitosamente',
        colmena: rows[0],
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: `Error: ${error.message}` }),
    };
  }
};

// Función auxiliar para encabezados CORS
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
