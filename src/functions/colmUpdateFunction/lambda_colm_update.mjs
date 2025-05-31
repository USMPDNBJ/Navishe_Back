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

    let body;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'El cuerpo de la solicitud no es un JSON válido' }),
      };
    }

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

    // 1. Buscar si existe la colmena
    const searchQuery = `SELECT * FROM t_colmena WHERE id_colmena = ?`;
    const searchResultRaw = await connection.execute(searchQuery, [id_colmena]);
    if (!Array.isArray(searchResultRaw) || searchResultRaw.length === 0) {
      await connection.end();
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Error interno: resultado inesperado de la base de datos (search)' }),
      };
    }
    const [foundRows] = searchResultRaw;
    if (!Array.isArray(foundRows) || foundRows.length === 0) {
      await connection.end();
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Colmena no encontrada' }),
      };
    }

    // 2. Ejecutar la actualización
    const updateQuery = `
      UPDATE t_colmena
      SET nombre = ?, fecha_instalacion = ?, imagen_url = ?, id_sensores = ?, longitud = ?, latitud = ?
      WHERE id_colmena = ?;
    `;

    const updateResultRaw = await connection.execute(updateQuery, [
      nombre,
      fecha_instalacion,
      imagen_url,
      id_sensores,
      longitud,
      latitud,
      id_colmena
    ]);
    if (!Array.isArray(updateResultRaw)) {
      await connection.end();
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Error interno: resultado inesperado de la base de datos (update)' }),
      };
    }
    const [updateResult] = updateResultRaw;

    // Si no se actualizó ninguna fila, no existe el registro (por consistencia)
    if (!updateResult || updateResult.affectedRows === 0) {
      await connection.end();
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Colmena no encontrada' }),
      };
    }

    // 3. Consultar colmena actualizada
    const rowsRaw = await connection.execute(
      `SELECT id_colmena, nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud
       FROM t_colmena WHERE id_colmena = ?`,
      [id_colmena]
    );
    if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) {
      await connection.end();
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Error interno: resultado inesperado de la base de datos (select)' }),
      };
    }
    const [rows] = rowsRaw;
    if (!Array.isArray(rows)) {
      await connection.end();
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Error interno: resultado inesperado de la base de datos (select-rows)' }),
      };
    }

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
