import { jest } from '@jest/globals';

// Mock de MySQL2
jest.unstable_mockModule('mysql2/promise', () => {
  const executeMock = jest.fn();
  const endMock = jest.fn();

  return {
    createConnection: jest.fn(() => ({
      execute: executeMock,
      end: endMock,
      __executeMock: executeMock, // Para acceder desde los tests
      __endMock: endMock,
    })),
  };
});

const mysql = await import('mysql2/promise');
const { handler } = await import('../../../src/functions/colmDeleteFunction/lambda_colm_delete.mjs');
  
describe('handler - DELETE colmena (MySQL)', () => {
  let connectionMock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Obtenemos el mock de conexión recién creado para cada test
    connectionMock = mysql.createConnection();
  });

  test('retorna 400 si falta id_colmena', async () => {
    const response = await handler({ pathParameters: null });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('id_colmena es obligatorio');
  });

  test('retorna 404 si no se encuentra la colmena', async () => {
    connectionMock.__executeMock.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await handler({
      pathParameters: { id: '999' },
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Colmena no encontrada');
  });

  test('retorna 200 si elimina correctamente la colmena', async () => {
    connectionMock.__executeMock.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await handler({
      pathParameters: { id: '35' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Colmena eliminada exitosamente');
    expect(body.id_colmena).toBe('35');
  });

  test('retorna 500 en caso de error interno', async () => {
    // Configuración específica para este test
    connectionMock.__executeMock.mockRejectedValue(new Error('Error de conexión a la base de datos'));

    const response = await handler({ pathParameters: { id: '35' } });

    // Depuración
    console.log('Response:', {
      status: response.statusCode,
      body: JSON.parse(response.body)
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toMatch(/Error interno: Error de conexión a la base de datos/);
  });
});