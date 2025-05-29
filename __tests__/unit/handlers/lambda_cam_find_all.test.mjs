import { jest } from '@jest/globals';
import { handler } from '../../../src/functions/camFindAllFunction/lambda_cam_find_all.mjs';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'bd-mysql-na-vishe.csbswo6i0muu.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vishe-1234',
  database: 'bd-na-vishe-test',
  port: 3306
};

describe('lambda_cam_find_all - Pruebas de Integración Seguras', () => {
  let pool;
  let connection;
  const testCameraPrefix = '[TEST] '; // Prefijo único para identificarlas

  beforeAll(async () => {
    jest.setTimeout(10000);
    pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();
    
    // Insertar datos de prueba con prefijo identificable
    await connection.execute(
      `INSERT INTO t_camera (nombre, url_camera)
       VALUES (?, ?)`,
      [`${testCameraPrefix}Cámara Entrada`, 'rtsp://test-entrada.example.com']
    );
    
    await connection.execute(
      `INSERT INTO t_camera (nombre, url_camera)
       VALUES (?, ?)`,
      [`${testCameraPrefix}Cámara Salida`, 'rtsp://test-salida.example.com']
    );
  });

  afterAll(async () => {
    // Eliminar SOLO los registros de prueba usando el prefijo
    await connection.execute(
      `DELETE FROM t_camera WHERE nombre LIKE ?`,
      [`${testCameraPrefix}%`]
    );
    connection.release();
    await pool.end();
  });

  describe('GET /camaras', () => {
    it('debe incluir las cámaras de prueba insertadas', async () => {
      const event = { httpMethod: 'GET' };
      const response = await handler(event);
      const cameras = JSON.parse(response.body);
      
      const testCameras = cameras.filter(c => 
        c.nombre.startsWith(testCameraPrefix)
      );
      
      expect(testCameras.length).toBe(2);
      expect(testCameras.some(c => c.nombre.includes('Entrada'))).toBeTruthy();
      expect(testCameras.some(c => c.nombre.includes('Salida'))).toBeTruthy();
    });

    it('no debe afectar cámaras existentes', async () => {
      // 1. Contar cámaras existentes antes de insertar pruebas
      const [before] = await connection.execute(
        'SELECT COUNT(*) as total FROM t_camera WHERE nombre NOT LIKE ?',
        [`${testCameraPrefix}%`]
      );
      const existingCount = before[0].total;
      
      // 2. Ejecutar la lambda
      const event = { httpMethod: 'GET' };
      const response = await handler(event);
      const cameras = JSON.parse(response.body);
      
      // 3. Verificar que el conteo de no-pruebas se mantiene
      const nonTestCameras = cameras.filter(c => 
        !c.nombre.startsWith(testCameraPrefix)
      );
      expect(nonTestCameras.length).toBe(existingCount);
    });
  });

  describe('Estructura de respuesta', () => {
    it('debe devolver el formato correcto para cada cámara', async () => {
      const event = { httpMethod: 'GET' };
      const response = await handler(event);
      const cameras = JSON.parse(response.body);
      
      cameras.forEach(camera => {
        expect(camera).toHaveProperty('id');
        expect(camera).toHaveProperty('nombre');
        expect(camera).toHaveProperty('url_camera');
        expect(typeof camera.id).toBe('number');
        expect(typeof camera.nombre).toBe('string');
        expect(typeof camera.url_camera).toBe('string');
      });
    });
  });
});