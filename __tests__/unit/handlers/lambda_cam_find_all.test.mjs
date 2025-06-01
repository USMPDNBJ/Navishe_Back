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

const mockCameras = [
  { id: 1, nombre: 'Cámara 1', url_camera: 'rtsp://cam1' },
  { id: 2, nombre: 'Cámara 2', url_camera: 'rtsp://cam2' }
];

// Importa la función pura después del mock
import { camFindAllHandler } from '../../../src/functions/camFindAllFunction/lambda_cam_find_all.mjs';

const mockPool = {
  getConnection: mockGetConnection
};

describe('lambda_cam_find_all - Pruebas Unitarias', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver la lista de cámaras correctamente', async () => {
    mockQuery.mockResolvedValue([mockCameras]);
    const event = { httpMethod: 'GET' };
    const response = await camFindAllHandler(event, mockPool);
    const cameras = JSON.parse(response.body);
    expect(Array.isArray(cameras)).toBe(true);
    expect(cameras.length).toBe(2);
    expect(cameras[0]).toHaveProperty('id');
    expect(cameras[0]).toHaveProperty('nombre');
    expect(cameras[0]).toHaveProperty('url_camera');
  });

  it('debe devolver un arreglo vacío si no hay cámaras', async () => {
    mockQuery.mockResolvedValue([[]]);
    const event = { httpMethod: 'GET' };
    const response = await camFindAllHandler(event, mockPool);
    const cameras = JSON.parse(response.body);
    expect(Array.isArray(cameras)).toBe(true);
    expect(cameras.length).toBe(0);
  });

  it('debe devolver un error 500 si ocurre una excepción', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));
    const event = { httpMethod: 'GET' };
    const response = await camFindAllHandler(event, mockPool);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toHaveProperty('error');
  });
});