import { jest } from '@jest/globals';
import { handler } from '../../../src/functions/trabajadorUpdateFunction/lambda_trabajadores_update.mjs';
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

describe('lambda_trabajadores_update - Pruebas de Integración Real', () => {
  let pool;
  let connection;
  let testTrabajadorId;

  // Configuración inicial - crear datos de prueba
  beforeAll(async () => {
    pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();
    
    // Insertar trabajador de prueba
    const [result] = await connection.execute(`
      INSERT INTO t_trabajador 
      (correo, nombre, contrasena, rol, status, dni) 
      VALUES 
      ('test_update@vishe.com', 'Usuario Prueba Update', 'testpass123', 'user', 1, '99998888')
    `);
    
    testTrabajadorId = result.insertId;
  });

  // Limpieza - eliminar datos de prueba
  afterAll(async () => {
    await connection.execute(`
      DELETE FROM t_trabajador 
      WHERE id_trabajador = ? OR correo LIKE 'test_update%@vishe.com'
    `, [testTrabajadorId]);
    connection.release();
    await pool.end();
  });

  describe('Método OPTIONS', () => {
    it('debe manejar correctamente las solicitudes OPTIONS', async () => {
      const event = { httpMethod: 'OPTIONS' };
      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Methods']).toContain('PUT');
    });
  });

  describe('Validación de método HTTP', () => {
    it('debe rechazar métodos diferentes a PUT', async () => {
      const event = { httpMethod: 'POST' };
      const response = await handler(event);
      
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Método no permitido'
      });
    });
  });

  describe('Validación de parámetros', () => {
    it('debe requerir un ID de trabajador', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: {},
        body: JSON.stringify({})
      };
      
      const response = await handler(event);
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: "ID de trabajador no proporcionado"
      });
    });

    it('debe validar todos los campos requeridos', async () => {
      const testCases = [
        { correo: null, nombre: 'Test', contrasena: 'pass', rol: 'admin', status: 1, dni: '123' },
        { correo: 'test@mail.com', nombre: null, contrasena: 'pass', rol: 'admin', status: 1, dni: '123' },
        // Agrega más casos para cada campo requerido
      ];

      for (const body of testCases) {
        const event = {
          httpMethod: 'PUT',
          pathParameters: { id: testTrabajadorId },
          body: JSON.stringify(body)
        };
        
        const response = await handler(event);
        expect(response.statusCode).toBe(400);
      }
    });
  });

  describe('Actualización exitosa', () => {
    it('debe actualizar correctamente un trabajador', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: { id: testTrabajadorId },
        body: JSON.stringify({
          correo: 'actualizado@mail.com',
          nombre: 'Nombre Actualizado',
          contrasena: 'nuevacontra',
          rol: 'admin',
          status: '0',
          dni: '11112222'
        })
      };

      const response = await handler(event);
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        message: "Trabajador actualizado correctamente"
      });

      // Verificar que los cambios se aplicaron en la base de datos
      const [rows] = await connection.execute(
        'SELECT * FROM t_trabajador WHERE id_trabajador = ?',
        [testTrabajadorId]
      );
      
      expect(rows[0].correo).toBe('actualizado@mail.com');
      expect(rows[0].nombre).toBe('Nombre Actualizado');
      expect(rows[0].rol).toBe('admin');
      expect(rows[0].status).toBe(0);
    });
  });

  describe('Trabajador no encontrado', () => {
    it('debe retornar 404 si el trabajador no existe', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: { id: '999999' },
        body: JSON.stringify({
          correo: 'noexiste@mail.com',
          nombre: 'No Existe',
          contrasena: 'pass',
          rol: 'user',
          status: 1,
          dni: '00000000'
        })
      };

      const response = await handler(event);
      
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        message: "Trabajador no encontrado"
      });
    });
  });  
});