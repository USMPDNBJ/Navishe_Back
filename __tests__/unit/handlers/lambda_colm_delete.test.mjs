import { jest } from '@jest/globals';


// ✅ 1. Mock ANTES de cualquier import del handler
jest.unstable_mockModule('mysql2/promise', () => {
  const connectionMock = {
    execute: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      createConnection: jest.fn().mockResolvedValue(connectionMock),
    },
    __executeMock: connectionMock.execute,
  };
});

let handler;
let mysql;

beforeAll(async () => {
  // ✅ 2. Importar después del mock
  const mod = await import('../../../src/functions/colmDeleteFunction/lambda_colm_delete.mjs');
  handler = mod.handler;

  mysql = await import('mysql2/promise'); // este será el mock
});

test('retorna 500 en caso de error interno', async () => {
  // ✅ 3. Forzar que `execute` lance un error
  mysql.__executeMock.mockReset();
  mysql.__executeMock.mockRejectedValueOnce(new Error('Error de conexión'));

  const response = await handler({ pathParameters: { id: '35' } });

  console.log('Mock calls:', mysql.__executeMock.mock.calls);
  console.log('Response:', response);

  // ✅ 4. Este assert debería pasar
  expect(mysql.__executeMock).toHaveBeenCalled();
  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body).error).toBe('Error interno del servidor');
});
