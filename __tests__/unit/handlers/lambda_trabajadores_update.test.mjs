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
import { trabajadorUpdateHandler } from '../../../src/functions/trabajadorUpdateFunction/lambda_trabajadores_update.mjs';

const mockPool = {
  getConnection: mockGetConnection
};

describe('lambda_trabajadores_update - Pruebas Unitarias', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe actualizar correctamente un trabajador', async () => {
    // Simula que se actualizó 1 fila
    mockExecute.mockResolvedValue([{ affectedRows: 1 }]);
    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: 1 },
      body: JSON.stringify({
        correo: 'actualizado@mail.com',
        nombre: 'Nombre Actualizado',
        contrasena: 'nuevacontra',
        rol: 'admin',
        status: 0,
        dni: '11112222'
      })
    };
    const response = await trabajadorUpdateHandler(event, mockPool);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ message: 'Trabajador actualizado correctamente' });
  });

  it('debe requerir un ID de trabajador', async () => {
    const event = {
      httpMethod: 'PUT',
      pathParameters: {},
      body: JSON.stringify({})
    };
    const response = await trabajadorUpdateHandler(event, mockPool);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });

  it('debe retornar 404 si el trabajador no existe', async () => {
    // Simula que no se actualizó ninguna fila
    mockExecute.mockResolvedValue([{ affectedRows: 0 }]);
    const event = {
      httpMethod: 'PUT',
      pathParameters: { id: 999 },
      body: JSON.stringify({
        correo: 'noexiste@mail.com',
        nombre: 'No Existe',
        contrasena: 'pass',
        rol: 'user',
        status: 1,
        dni: '00000000'
      })
    };
    const response = await trabajadorUpdateHandler(event, mockPool);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ message: 'Trabajador no encontrado' });
  });
});