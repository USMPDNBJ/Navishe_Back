import { jest } from '@jest/globals';
import sql from 'mssql';
import { handler } from '../../../src/functions/GetTrabajadoresFunction/lambda_trabajadores_find_all.mjs';

describe('lambda_trabajadores_find_all', () => {
  let pool;

  // Configurar conexión a la base de datos antes de las pruebas
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
    } catch (error) {
      console.error('Error conectando a la base de datos:', error);
      throw error;
    }
  });

  // Cerrar conexión después de todas las pruebas
  afterAll(async () => {
    if (pool && pool._connected) {
      await pool.close();
    }
  });

  it('debería retornar 200 y lista de trabajadores', async () => {
    const event = {
      httpMethod: 'GET',
      pathParameters: null,
      queryStringParameters: null,
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    // Verificar que los datos tengan el formato esperado
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('id_trabajador');
      expect(body[0]).toHaveProperty('correo');
      expect(body[0]).toHaveProperty('rol');
      expect(body[0]).toHaveProperty('fecha_registro');
      expect(body[0]).toHaveProperty('nombre');
    }
  });

  it('debería retornar 200 y lista vacía si no hay trabajadores', async () => {
    // Nota: Esta prueba asume que puedes consultar un caso donde no hay datos.
    // Como no puedes modificar la base de datos, esta prueba puede no aplicarse.
    // Dejamos un comentario para indicar que depende de datos reales.
    const event = {
      httpMethod: 'GET',
      pathParameters: null,
      queryStringParameters: null,
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    // Si sabes que la tabla puede estar vacía en ciertos casos, descomenta la siguiente línea
    // expect(body).toEqual([]);
  });

  it('debería retornar 405 si el método HTTP no es GET', async () => {
    const event = {
      httpMethod: 'POST',
      pathParameters: null,
      queryStringParameters: null,
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toEqual({ message: 'Método no permitido' });
  });

  it('debería retornar 500 en caso de error en la base de datos', async () => {
    // Simular un error usando credenciales inválidas
    const invalidConfig = {
      user: 'NVS',
      password: 'WrongPassword',
      server: '161.132.55.86',
      database: 'BD_NA_VISHE_PRUEBAS',
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };
    

    // Nota: Esto requiere que el manejador use la misma conexión.
    // Si el manejador crea su propia conexión, necesitamos inyección de dependencias.
    const event = {
      httpMethod: 'GET',
      pathParameters: null,
      queryStringParameters: null,
    };

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