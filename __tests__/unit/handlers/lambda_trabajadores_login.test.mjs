import { jest } from '@jest/globals';
import sql from 'mssql';
import { handler } from '../../../src/functions/LoginTrabajadorFunction/lambda_trabajadores_login.mjs';

describe('lambda_trabajadores_login', () => {
  let pool;

  // Configurar conexión y verificar tabla antes de las pruebas
  beforeAll(async () => {
    try {
      pool = await sql.connect({
       user: 'NVS',
      password: '@Vishe1234',
      server: '161.132.55.86',
      database: 'BD_NA_VISHE_PRUEBAS',// Reemplaza con el nombre de tu base de datos
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      });
      // Verificar si la tabla t_trabajador existe, crearla si es necesario
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 't_trabajador')
        CREATE TABLE t_trabajador (
          correo VARCHAR(255),
          contrasena VARCHAR(255),
          rol VARCHAR(50)
        )
      `);
    } catch (error) {
      console.error('Error conectando a la base de datos o creando la tabla:', error);
      throw error;
    }
  });

  // Limpiar y preparar datos después de cada prueba
  afterEach(async () => {
    if (!pool || pool._connected === false) {
      pool = await sql.connect({
        user: 'NVS',
      password: '@Vishe1234',
      server: '161.132.55.86',
      database: 'BD_NA_VISHE_PRUEBAS',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      });
    }
    await pool.request().query('DELETE FROM t_trabajador');
    await pool.request().query(`
      INSERT INTO t_trabajador (correo, contrasena, rol)
      VALUES ('admin@vishe.com', '123456', 'admin')
    `);
  });

  // Cerrar conexión después de todas las pruebas
  afterAll(async () => {
    if (pool && pool._connected) {
      await pool.close();
    }
  });

  it('debería retornar rol si el login es exitoso', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        correo: 'admin@vishe.com',
        contrasena: '123456',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ rol: 'admin' });
  });

  it('debería retornar 401 si las credenciales son incorrectas', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        correo: 'fake@vishe.com',
        contrasena: 'wrongpass',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ message: 'Credenciales incorrectas' });
  });

  it('debería retornar 400 si faltan campos requeridos', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        correo: 'incompleto@vishe.com',
      }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Faltan campos requeridos: correo o contraseña',
    });
  });

  it('debería retornar 500 si ocurre un error en la base de datos', async () => {
    // Cerrar la conexión para simular un error
     const originalConnect = sql.connect;
  sql.connect = jest.fn().mockRejectedValue(new Error('Error de conexión simulado'));

  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      correo: 'admin@vishe.com',
      contrasena: '123456',
      }),
    };

   const response = await handler(event);

  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body)).toEqual({
    message: 'Error interno al validar login',
    error: 'Error de conexión simulado'
     });

    // Reconectar para otras pruebas
    if (!pool || pool._connected === false) {
      pool = await sql.connect({
       user: 'NVS',
      password: '@Vishe1234',
      server: '161.132.55.86',
      database: 'BD_NA_VISHE_PRUEBAS',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      });
    }
  });
});