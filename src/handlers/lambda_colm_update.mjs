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

    // Obtener id_colmena de pathParameters
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
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
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
        body: JSON.stringify({ error: 'nombre, fecha_instalacion, longitud y latitud son obligatorios' }),
      };
    }

    const pool = await sql.connect(dbConfig);

    const query = `
      UPDATE t_colmena
      SET nombre = @nombre,
          fecha_instalacion = @fecha_instalacion,
          imagen_url = @imagen_url,
          id_sensores = @id_sensores,
          longitud = @longitud,
          latitud = @latitud
      WHERE id_colmena = @id_colmena;

      SELECT id_colmena, nombre, fecha_instalacion, imagen_url, id_sensores, longitud, latitud
      FROM t_colmena
      WHERE id_colmena = @id_colmena
    `;

    const request = pool.request()
      .input('id_colmena', sql.Int, parseInt(id_colmena))
      .input('nombre', nombre)
      .input('fecha_instalacion', sql.DateTime, new Date(fecha_instalacion))
      .input('imagen_url', imagen_url)
      .input('id_sensores', id_sensores)
      .input('longitud', sql.Float, longitud)
      .input('latitud', sql.Float, latitud);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      await pool.close();
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Colmena no encontrada' }),
      };
    }

    const updatedColmena = result.recordset[0];

    await pool.close();

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        message: 'Colmena actualizada exitosamente',
        colmena: updatedColmena,
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
