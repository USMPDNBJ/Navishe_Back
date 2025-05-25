import { jest } from '@jest/globals';

// Mock de MySQL2
jest.unstable_mockModule('mysql2', () => {
  const executeMock = jest.fn();
  const connectionMock = {
    execute: executeMock,
    end: jest.fn(),
  };

  const poolMock = {
    promise: () => connectionMock,
  };

  return {
    createPool: jest.fn(() => poolMock),
    __connectionMock: connectionMock, // para acceder desde los tests
    __executeMock: executeMock,
  };
});

const mysql = await import('mysql2');
const { handler } = await import('../../../src/functions/colmDeleteFunction/lambda_colm_delete.mjs');

describe('handler - DELETE colmena (MySQL)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 400 si falta id_colmena', async () => {
    const response = await handler({ pathParameters: null });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('id_colmena es obligatorio');
  });

  test('retorna 404 si no se encuentra la colmena', async () => {
    mysql.__executeMock.mockResolvedValueOnce([{ affectedRows: 0 }, []]);

    const response = await handler({
      pathParameters: { id: '999' },
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Colmena no encontrada');
  });

  test('retorna 200 si elimina correctamente la colmena', async () => {
    mysql.__executeMock.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

    const response = await handler({
      pathParameters: { id: '150' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Colmena eliminada exitosamente');
    expect(body.id_colmena).toBe('150');
  });

  test('retorna 500 en caso de error interno', async () => {
    mysql.__executeMock.mockRejectedValueOnce(new Error('Error de conexión'));

    const response = await handler({ pathParameters: { id: '149' } });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toMatch(/Error de conexión/);
  });
});
