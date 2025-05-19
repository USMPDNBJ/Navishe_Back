// hello-world/tests/colm_find_all.test.mjs
import { jest } from '@jest/globals';

// 🔧 Crear mocks manuales de sql.connect y request().query
const mockQuery = jest.fn();
const mockRequest = () => ({ query: mockQuery });
const mockClose = jest.fn();
const mockConnect = jest.fn();

// 📦 Mock del módulo 'mssql' usando ESM
jest.unstable_mockModule('mssql', () => ({
  default: {
    connect: mockConnect,
  },
  connect: mockConnect,
}));

// ⚠️ Importar después de hacer el mock
const { handler } = await import('../../../src/functions/colmFindAllFunction/lambda_colm_find_all.mjs');

describe('handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return beehives data successfully', async () => {
    mockQuery.mockResolvedValueOnce({
      recordset: [
        {
          id_colmena: 1,
          nombre: 'Colmena A',
          fecha_instalacion: '2023-01-01',
          imagen_url: 'https://example.com/image.jpg',
          id_sensores: 101,
        },
      ],
    });

    mockConnect.mockResolvedValueOnce({
      request: mockRequest,
      close: mockClose,
    });

    const response = await handler();

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe('Beehives retrieved successfully');
    expect(body.data).toBeDefined();
  });

  it('should handle errors', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Connection failed'));

    const response = await handler();

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error retrieving beehives');
    expect(body.error).toBe('Connection failed');
  });
});
