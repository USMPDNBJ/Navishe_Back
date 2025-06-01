import { jest } from '@jest/globals';

// Mock antes de importar el handler
const mockExecute = jest.fn();
const mockRelease = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  release: mockRelease
});
const mockCreatePool = jest.fn(() => ({
  getConnection: mockGetConnection,
  end: jest.fn()
}));

jest.unstable_mockModule('mysql2/promise', () => ({
  createPool: mockCreatePool
}));

// Importa la función pura después del mock
import { trabajadorLoginHandler } from '../../../src/functions/trabajadorLoginFunction/lambda_trabajadores_login.mjs';

const mockPool = {
  getConnection: mockGetConnection
};

describe('lambda_trabajadores_login - Pruebas Unitarias', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar el rol cuando las credenciales son válidas', async () => {
    // Simula usuario encontrado y contraseña correcta
    mockExecute.mockResolvedValue([[{ rol: 'admin', contrasena: 'testpass123' }]]);
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ correo: 'test@vishe.com', contrasena: 'testpass123' })
    };
    const response = await trabajadorLoginHandler(event, mockPool);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ rol: 'admin' });
  });

  it('debe retornar 401 cuando las credenciales son incorrectas', async () => {
    // Simula usuario encontrado pero contraseña incorrecta
    mockExecute.mockResolvedValue([[{ rol: 'admin', contrasena: 'testpass123' }]]);
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ correo: 'test@vishe.com', contrasena: 'wrongpass' })
    };
    const response = await trabajadorLoginHandler(event, mockPool);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({ message: 'Credenciales incorrectas' });
  });

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
      const response = await trabajadorLoginHandler(event, mockPool);
      expect(response.statusCode).toBe(400);
    }
  });
});