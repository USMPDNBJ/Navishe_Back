// hello-world/tests/lambda_trabajadores_delete.test.mjs
import { jest } from '@jest/globals';

// 🎭 Mocks manuales para `mssql`
const mockQuery = jest.fn();
const mockInput = jest.fn(() => ({ query: mockQuery }));
const mockRequest = () => ({ input: mockInput });
const mockClose = jest.fn();
const mockConnect = jest.fn();

// 📦 Mock del módulo 'mssql'
jest.unstable_mockModule('mssql', () => ({
  default: {
    connect: mockConnect,
    Int: 'Int',
  },
  connect: mockConnect,
  Int: 'Int',
}));

// ⚠️ Importar la lambda DESPUÉS del mock
const { handler } = await import('../../../src/functions/trabajadorDeleteFunction/lambda_trabajadores_delete.mjs'); // Ajusta ruta si es necesario

describe('handler - lambda_trabajadores_delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 when worker is deleted successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });

    mockConnect.mockResolvedValueOnce({
      request: mockRequest,
      close: mockClose,
    });

    const event = {
      body: JSON.stringify({ id_trabajador: 123 }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Worker deleted successfully');
  });

  it('should return 404 when worker not found', async () => {
    mockQuery.mockResolvedValueOnce({ rowsAffected: [0] });

    mockConnect.mockResolvedValueOnce({
      request: mockRequest,
      close: mockClose,
    });

    const event = {
      body: JSON.stringify({ id_trabajador: 999 }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Worker not found');
  });

  it('should return 400 when id_trabajador is missing', async () => {
    const event = {
      body: JSON.stringify({}),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('id_trabajador is required');
  });

  it('should return 500 on unexpected error', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Unexpected failure'));

    const event = {
      body: JSON.stringify({ id_trabajador: 123 }),
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Unexpected failure');
  });
});
