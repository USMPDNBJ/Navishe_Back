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
  try {  

    const {      
      correo,
      nombre,
      contrasena,
      rol,
      status,
      dni
    } = JSON.parse(event.body);

    console.log(event.pathParameters?.id)  
    const id_trabajador = event.pathParameters?.id;
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("id_trabajador", sql.Int, id_trabajador)
      .input("correo", sql.VarChar, correo)
      .input("nombre", sql.VarChar, nombre)
      .input("contrasena", sql.VarChar, contrasena)
      .input("rol", sql.VarChar, rol)
      .input("status", sql.VarChar, status)
      .input("dni", sql.VarChar, dni)
      .query(`
        UPDATE t_trabajador
        SET correo = @correo,
            nombre = @nombre,
            contrasena = @contrasena,
            rol = @rol,
            status = @status,
            dni = @dni
        WHERE id_trabajador = @id_trabajador
      `);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Habilitar CORS
        "Access-Control-Allow-Methods": "PUT, OPTIONS", // Métodos permitidos
        "Access-Control-Allow-Headers": "Content-Type, Authorization" // Encabezados permitidos
      },
      body: JSON.stringify({ message: "Trabajador actualizado correctamente" }),
    };
  } catch (err) {
    console.error("Error al actualizar trabajador:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al actualizar trabajador" }),
    };
  }
};
