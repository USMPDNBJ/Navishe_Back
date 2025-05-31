import { jest } from '@jest/globals';

const mockExecute = jest.fn().mockResolvedValue([[/* rows */], []]);

const mockConnection = {
  execute: mockExecute,
  end: jest.fn().mockResolvedValue()
};

const mockCreateConnection = jest.fn(() => mockConnection);

jest.unstable_mockModule('mysql2/promise', () => ({
  default: {
    createConnection: mockCreateConnection,
  },
  createConnection: mockCreateConnection,
}));

const mysql = await import('mysql2/promise');
const { handler } = await import('../../../src/functions/colmCreateFunction/lambda_colm_create.mjs');

describe('Lambda colm_create Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue([[/* empty result */], []]);
  });

  it('should create a colmena successfully', async () => {
    const event = {
      nombre: 'Colmena Test',
      fecha_instalacion: '2025-05-19T00:00:00Z',
      imagen_url: 'https://example.com/colmena.jpg',
      id_sensores: 'sensor123',
      longitud: -76.123456,
      latitud: -12.123456
    };

    const response = await handler(event);    
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    console.log("mensaje",body.message)
    expect(body.message).toBe('Colmena creada exitosamente');
    expect(mockExecute).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Connection failed'));

    const event = {
      nombre: 'Colmena Test',
      fecha_instalacion: '2025-05-19T00:00:00Z',
      id_sensores: 'sensor123',
      longitud: -76.123456,
      latitud: -12.123456
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
  });
});
