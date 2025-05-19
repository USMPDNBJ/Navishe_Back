  import * as sql from 'mssql';

  export const handler = async (event) => {
    try {
      // Verificar httpMethod (opcional, ajusta según el método deseado)

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

      // Obtener id_colmena del evento
      const id_colmena = event.pathParameters?.id;

      // Validar parámetro requerido
      if (!id_colmena) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          },
          body: JSON.stringify({ error: 'id_colmena es obligatorio' }),
        };
      }

      // Conectar a la base de datos
      const pool = await sql.connect(dbConfig);

      // Eliminar colmena por id_colmena
      const query = `
        DELETE FROM t_colmena
        WHERE id_colmena = @id_colmena
      `;
      const request = pool.request()
        .input('id_colmena', sql.Int, id_colmena);

      const result = await request.query(query);

      // Verificar si se eliminó alguna fila
      if (result.rowsAffected[0] === 0) {
        await pool.close();
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          },
          body: JSON.stringify({ error: 'Colmena no encontrada' }),
        };
      }

      // Cerrar conexión
      await pool.close();
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({
          message: 'Colmena eliminada exitosamente',
          id_colmena,
        }),
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        body: JSON.stringify({ error: `Error: ${error.message}` }),
      };
    }
  };