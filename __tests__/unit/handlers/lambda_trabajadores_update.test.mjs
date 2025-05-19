import { handler } from '../../../src/functions/UpdateTrabajadorFunction/lambda_trabajadores_update.mjs';
import sql from 'mssql';

const dbConfig = {
  server: '161.132.55.86',
  user: 'NVS',
  password: '@Vishe1234',
  database: 'BD_NA_VISHE_PRUEBAS',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

describe('Lambda handler - update trabajador', () => {
  let insertedId;
  let testPool;  // Usamos un pool exclusivo para los tests

  beforeAll(async () => {
    testPool = await sql.connect(dbConfig);  // Conexión independiente para el test
    
    // Limpiar datos de prueba previos
    await testPool.request()
      .query(`DELETE FROM t_trabajador WHERE correo IN ('test@correo.com', 'nuevo@email.com')`);
    
    // Insertar registro de prueba
    const result = await testPool.request()
      .input('correo', sql.VarChar, 'test@correo.com')
      .input('nombre', sql.VarChar, 'Test Nombre')
      .input('contrasena', sql.VarChar, 'test1234')
      .input('rol', sql.VarChar, 'user')
      .input('status', sql.Bit, 1)
      .input('dni', sql.VarChar, '87654321')
      .input('fecha_registro', sql.DateTime, new Date())
      .query(`
        INSERT INTO t_trabajador (correo, nombre, contrasena, rol, status, dni, fecha_registro)
        OUTPUT INSERTED.id_trabajador
        VALUES (@correo, @nombre, @contrasena, @rol, @status, @dni, @fecha_registro)
      `);

    insertedId = result.recordset[0].id_trabajador;
    console.log('ID insertado para pruebas:', insertedId);
  });

  it('debería actualizar un trabajador exitosamente', async () => {
    const mockEvent = {
      pathParameters: { id: String(insertedId) },
      body: JSON.stringify({
        correo: "nuevo@email.com",
        nombre: "Nuevo Nombre",
        contrasena: "nuevacontra",
        rol: "admin",
        status: "ACTIVO",
        dni: "12345678"
      })
    };

    const result = await handler(mockEvent);
    expect(result.statusCode).toBe(200);
  });

  afterAll(async () => {
    try {
      // Verificar si la conexión sigue activa antes de limpiar
      if (testPool.connected) {
        await testPool.request()
          .input('id', sql.Int, insertedId)
          .query('DELETE FROM t_trabajador WHERE id_trabajador = @id');
      }
    } catch (error) {
      console.error('Error en afterAll:', error);
    } finally {
      // Cerrar la conexión del testPool (no afecta al handler)
      if (testPool.connected) {
        await testPool.close();
      }
    }
  });
});