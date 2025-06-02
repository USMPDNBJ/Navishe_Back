import { jest } from '@jest/globals';
import { handler } from '../../../src/functions/trabajadorLoginFunction/lambda_trabajadores_login.mjs';
import mysql from 'mysql2/promise';

// Configuración real de la base de datos
const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

describe('lambda_trabajadores_login - Pruebas de Integración Real', () => {
  let pool;
  let connection;

  // Configuración inicial - crear datos de prueba
  beforeAll(async () => {
    pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();
    
    // Insertar usuario de prueba
    await connection.execute(`
      INSERT INTO t_trabajador 
      (correo, nombre, contrasena, rol, status, dni) 
      VALUES 
      ('test_login@vishe.com', 'Usuario Prueba Login', 'testpass123', 'admin', 1, '99999999')
    `);
  });

  // Limpieza - eliminar datos de prueba
  afterAll(async () => {
    await connection.execute(`
      DELETE FROM t_trabajador 
      WHERE correo = 'test_login@vishe.com'
    `);
    connection.release();
    await pool.end();
  });

  describe('Método OPTIONS', () => {
    it('debe responder correctamente a OPTIONS para CORS', async () => {
      const event = { httpMethod: 'OPTIONS' };
      const response = await handler(event);
      
      expect(response).toEqual({
        statusCode: 200,
        headers: expect.objectContaining({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        }),
        body: JSON.stringify({})
      });
    });
  });

  describe('Validación de métodos HTTP', () => {
    it('debe rechazar métodos distintos a POST con 405', async () => {
      const event = { httpMethod: 'GET', body: JSON.stringify({}) };
      const response = await handler(event);
      
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Método no permitido'
      });
    });
  });

  describe('Validación de campos', () => {
    it('debe requerir correo y contraseña', async () => {
      const testCases = [
        { correo: null, contrasena: 'pass123' },
        { correo: 'test@mail.com', contrasena: null },
        { correo: null, contrasena: null }
      ];

      for (const testCase of testCases) {
        const event = {
          httpMethod: 'POST',
          body: JSON.stringify(testCase)
        };
        
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
      }
    });
  });

  describe('Autenticación exitosa', () => {
    it('debe retornar el rol cuando las credenciales son válidas', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          correo: 'test_login@vishe.com',
          contrasena: 'testpass123'
        })
      };

      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        rol: 'admin'
      });
    });
  });

  describe('Credenciales inválidas', () => {
    it('debe retornar 401 cuando las credenciales son incorrectas', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          correo: 'test_login@vishe.com',
          contrasena: 'contrasena_incorrecta'
        })
      };

      const response = await handler(event);
      
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Credenciales incorrectas'
      });
    });
  });  
});