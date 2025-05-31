import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import mysql from 'mysql2/promise';

// Mocks para conexión y ejecución de MySQL
const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockConnection = {
  execute: mockExecute,
  end: mockEnd
};

// Spy en createConnection
const createConnectionSpy = jest.spyOn(mysql, 'createConnection')
  .mockImplementation(() => Promise.resolve(mockConnection));

// Importar el handler DESPUÉS del mock
const { handler } = await import('../../../src/functions/trabajadorCreateFunction/lambda_trabajadores_create.mjs');

// Mock de contexto
const mockContext = {
  awsRequestId: 'test-id-123'
};

beforeEach(() => {
  // Limpiar todos los mocks
  jest.clearAllMocks();
  createConnectionSpy.mockClear();
  mockExecute.mockReset();
  mockEnd.mockReset();
});

describe('handler - lambda_trabajadores_create (MySQL)', () => {
  it('should return 201 when worker is created successfully', async () => {
    // Mock para verificación de DNI
    mockExecute
      .mockResolvedValueOnce([[{ count: 0 }]]) // Primera llamada: verificar DNI
      .mockResolvedValueOnce([{ insertId: 'test-id-123' }]); // Segunda llamada: insertar trabajador

    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '11112222',
      }),
    };

    const response = await handler(mockEvent, mockContext);
    
    // Verificar respuesta
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Worker created successfully');
    expect(body.id_trabajador).toBe('test-id-123');

    // Verificar que los mocks fueron llamados correctamente
    expect(createConnectionSpy).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockEnd).toHaveBeenCalledTimes(1);

    // Verificar los parámetros de las llamadas
    expect(mockExecute.mock.calls[0][1]).toEqual(['11112222']); // Verificación DNI
  });

  it('should return 409 if DNI already exists', async () => {
    // Mock para DNI existente
    mockExecute.mockResolvedValueOnce([[{ count: 1 }]]);

    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '87654321',
      }),
    };

    const response = await handler(mockEvent, mockContext);
    
    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('DNI already exists');

    expect(createConnectionSpy).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if email is invalid', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo-malo',
        nombre: 'Miguel',
        dni: '87654321',
      }),
    };

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Invalid email format');
  });

  it('should return 400 if DNI is not 8 digits', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '123',
      }),
    };

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('DNI must be 8 digits');
  });

  it('should return 400 if required field is missing', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        // falta dni
      }),
    };

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toMatch(/Missing required field/);
  });

  it('should return 500 on unexpected error', async () => {
    // Mock para simular error en la base de datos
    mockExecute.mockRejectedValueOnce(new Error('Unexpected failure'));

    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '99999999',
      }),
    };

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Unexpected failure');
  });
});