// Importa jest explícitamente
import { jest } from '@jest/globals';
import { handler } from '../../../src/functions/trabajadorFindAllFunction/lambda_trabajadores_find_all.mjs';
import mysql from 'mysql2/promise';

// Configuración real de la DB para pruebas de integración
const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
  port: 3306
};

describe('Pruebas de Integración Real', () => {
  let pool;
  let connection;

  beforeAll(async () => {
    pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();
    
    // Preparar datos de prueba
    await connection.execute(`
      INSERT INTO t_trabajador 
      (correo, nombre, contrasena, rol, status, dni) 
      VALUES 
      ('test_jest1@vishe.com', 'Usuario Jest 1', 'pass1', 'user', 1, '11111111'),
      ('test_jest2@vishe.com', 'Usuario Jest 2', 'pass2', 'admin', 0, '22222222')
    `);
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await connection.execute(`
      DELETE FROM t_trabajador 
      WHERE correo LIKE 'test_jest%@vishe.com'
    `);
    connection.release();
    await pool.end();
  });

  test('Debería retornar todos los trabajadores', async () => {
    const event = { httpMethod: 'GET' };
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    
    const trabajadores = JSON.parse(response.body);
    expect(trabajadores.some(t => t.correo.includes('test_jest'))).toBeTruthy();
  });

  describe('Filtrado de datos sensibles', () => {
    it('no debe incluir la contraseña en la respuesta', async () => {
      const event = { httpMethod: 'GET' };
      const response = await handler(event);
      const trabajadores = JSON.parse(response.body);
      
      trabajadores.forEach(trabajador => {
        expect(trabajador).not.toHaveProperty('contrasena');
      });
    });    
  });

  test('La respuesta debe ser un array de trabajadores', async () => {
    const event = { httpMethod: 'GET' };
    const response = await handler(event);
    const trabajadores = JSON.parse(response.body);

    expect(Array.isArray(trabajadores)).toBe(true);
  });
});
