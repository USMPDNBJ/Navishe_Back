// Importa jest explícitamente
import { jest } from '@jest/globals';

// Mock antes de importar el handler
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease
});
const mockCreatePool = jest.fn(() => ({
  getConnection: mockGetConnection,
  end: jest.fn()
}));

jest.unstable_mockModule('mysql2/promise', () => ({
  createPool: mockCreatePool
}));

const mockTrabajadores = [
  { id_trabajador: 1, fecha_registro: '2024-01-01', correo: 'test1@vishe.com', nombre: 'Test 1', rol: 'user', status: 1, dni: '111' },
  { id_trabajador: 2, fecha_registro: '2024-01-02', correo: 'test2@vishe.com', nombre: 'Test 2', rol: 'admin', status: 0, dni: '222' }
];

// Importa la función pura después del mock
import { trabajadorFindAllHandler } from '../../../src/functions/trabajadorFindAllFunction/lambda_trabajadores_find_all.mjs';

const mockPool = {
  getConnection: mockGetConnection
};

describe('lambda_trabajadores_find_all - Pruebas Unitarias', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver la lista de trabajadores correctamente', async () => {
    mockQuery.mockResolvedValue([mockTrabajadores]);
    const event = { httpMethod: 'GET' };
    const response = await trabajadorFindAllHandler(event, mockPool);
    const trabajadores = JSON.parse(response.body);
    expect(Array.isArray(trabajadores)).toBe(true);
    expect(trabajadores.length).toBe(2);
    expect(trabajadores[0]).toHaveProperty('correo');
    expect(trabajadores[0]).toHaveProperty('nombre');
    expect(trabajadores[0]).toHaveProperty('rol');
  });

  it('debe devolver un arreglo vacío si no hay trabajadores', async () => {
    mockQuery.mockResolvedValue([[]]);
    const event = { httpMethod: 'GET' };
    const response = await trabajadorFindAllHandler(event, mockPool);
    const trabajadores = JSON.parse(response.body);
    expect(Array.isArray(trabajadores)).toBe(true);
    expect(trabajadores.length).toBe(0);
  });

  it('no debe incluir la contraseña en la respuesta', async () => {
    // Simula que la consulta devuelve la propiedad contrasena
    const trabajadoresConContrasena = mockTrabajadores.map(t => ({ ...t, contrasena: 'secreta' }));
    mockQuery.mockResolvedValue([trabajadoresConContrasena]);
    const event = { httpMethod: 'GET' };
    const response = await trabajadorFindAllHandler(event, mockPool);
    const trabajadores = JSON.parse(response.body);
    trabajadores.forEach(trabajador => {
      expect(trabajador).not.toHaveProperty('contrasena');
    });
  });
});
