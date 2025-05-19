import sql from 'mssql';

export const handler = async (event) => {
  try {
    // Verificar httpMethod


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

    // Validar id_colmena
    if (!id_colmena) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: 'id_colmena es obligatorio' }),
      };
    }

    // Obtener datos del body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: 'El cuerpo de la solicitud no es un JSON válido' }),
      };
    }

    const { nombre, fecha_instalacion, imagen_url, id_sensores } = body;

    // Validar parámetros requeridos
    if (!nombre || !fecha_instalacion) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: 'nombre y fecha_instalacion son obligatorios' }),
      };
    }

    // Conectar a la base de datos
    const pool = await sql.connect(dbConfig);

    // Actualizar colmena por id_colmena
    const query = `
      UPDATE t_colmena
      SET nombre = @nombre,
          fecha_instalacion = @fecha_instalacion,
          imagen_url = @imagen_url,
          id_sensores = @id_sensores
      WHERE id_colmena = @id_colmena;
      SELECT id_colmena, nombre, fecha_instalacion, imagen_url, id_sensores
      FROM t_colmena
      WHERE id_colmena = @id_colmena
    `;
    const request = pool.request()
      .input('id_colmena', sql.Int, parseInt(id_colmena))
      .input('nombre', sql.VarChar(100), nombre)
      .input('fecha_instalacion', sql.DateTime, new Date(fecha_instalacion))
      .input('imagen_url', sql.VarChar(255), imagen_url)
      .input('id_sensores', sql.VarChar(100), id_sensores);

    const result = await request.query(query);

    // Verificar si se actualizó alguna fila
    if (result.recordset.length === 0) {
      await pool.close();
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: 'Colmena no encontrada' }),
      };
    }

    // Obtener los datos actualizados
    const updatedColmena = result.recordset[0];

    // Cerrar conexión
    await pool.close();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({
        message: 'Colmena actualizada exitosamente',
        colmena: updatedColmena,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      body: JSON.stringify({ error: `Error: ${error.message}` }),
    };
  }
};