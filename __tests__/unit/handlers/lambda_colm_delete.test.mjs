
import { jest } from '@jest/globals';

// Mock de MSSQL
jest.unstable_mockModule('mssql', () => {
  const queryMock = jest.fn();
  const inputMock = jest.fn().mockReturnThis();
  const requestMock = {
    input: inputMock,
    query: queryMock,
  };

  const poolMock = {
    request: () => requestMock,
    close: jest.fn(),
  };

  return {
    connect: jest.fn().mockResolvedValue(poolMock), // <-- ¡Clave aquí!
    Int: Symbol('Int'),
    __requestMock: requestMock, // para modificar los mocks en tests
  };
});

const sql = await import('mssql');
const { handler } = await import('../../../src/handlers/colmDeleteFunction/lambda_colm_delete.mjs');




describe('handler - DELETE colmena', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 400 si falta id_colmena', async () => {
    const response = await handler({
      pathParameters: null,
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('id_colmena es obligatorio');
  });

  test('retorna 404 si no se encuentra la colmena', async () => {
    sql.connect.mockResolvedValueOnce({
      request: () => sql.__requestMock,
      close: jest.fn(),
    });

    sql.__requestMock.query.mockResolvedValueOnce({ rowsAffected: [0] });

    const response = await handler({
      pathParameters: { id: '999' },
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Colmena no encontrada');
  });



  test('retorna 200 si elimina correctamente la colmena', async () => {
    sql.connect.mockResolvedValueOnce({
      request: () => sql.__requestMock,
      close: jest.fn(),
    });

    sql.__requestMock.query.mockResolvedValueOnce({ rowsAffected: [1] });

    const response = await handler({
      pathParameters: { id: '150' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Colmena eliminada exitosamente');
    expect(body.id_colmena).toBe('150');
  });


  test('retorna 500 en caso de error interno', async () => {
    // Forzamos el error en la conexión

    sql.connect.mockRejectedValueOnce(new Error('Error de conexión'));

    const response = await handler({ pathParameters: { id: '149' } });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toMatch(/Error de conexión/);
  });

});
