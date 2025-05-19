import sql from 'mssql';

const config = {
  user: 'NVS',
  password: '@Vishe1234',
  server: '161.132.55.86',
  database: 'BD_NA_VISHE_PRUEBAS',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

export const handler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "ID de trabajador no proporcionado" })
      };
    }

    const body = JSON.parse(event.body);
    const { correo, nombre, contrasena, rol, status, dni } = body;

    if (!correo || !nombre || !contrasena || !rol || !status || !dni) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan campos requeridos" })
      };
    }

    const statusBit = status === 'ACTIVO' || status === '1' || status === 1 ? 1 : 0;

    const pool = await sql.connect(config);

    const result = await pool.request()
      .input('id_trabajador', sql.Int, id)
      .input('correo', sql.VarChar, correo)
      .input('nombre', sql.VarChar, nombre)
      .input('contrasena', sql.VarChar, contrasena)
      .input('rol', sql.VarChar, rol)
      .input('status', sql.Bit, statusBit)
      .input('dni', sql.VarChar, dni)
      .input('fecha_registro', sql.DateTime, new Date())
      .query(`
        UPDATE t_trabajador
        SET correo = @correo,
            nombre = @nombre,
            contrasena = @contrasena,
            rol = @rol,
            status = @status,
            dni = @dni,
            fecha_registro = @fecha_registro
        WHERE id_trabajador = @id_trabajador
      `);

    if (result.rowsAffected[0] === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Trabajador no encontrado" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Trabajador actualizado correctamente" })
    };

  } catch (error) {
    console.error("Error al actualizar trabajador:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno del servidor" })
    };
  } finally {
    await sql.close();
  }
};
