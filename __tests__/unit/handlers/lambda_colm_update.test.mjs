import { jest } from '@jest/globals';

// Mock de mysql2/promise para ESM
const executeMock = jest.fn();
const queryMock = jest.fn();
const endMock = jest.fn();

jest.unstable_mockModule('mysql2/promise', () => {
  const connectionMock = {
    execute: executeMock,
    query: queryMock,
    end: endMock,
  };
  return {
    default: {
      createConnection: jest.fn(() => connectionMock),
    },
    createConnection: jest.fn(() => connectionMock),
  };
});

const mysqlModule = await import('mysql2/promise');
const mysql = mysqlModule.default || mysqlModule;
const { handler } = await import('../../../src/functions/colmUpdateFunction/lambda_colm_update.mjs');

describe('handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 400 si falta id_colmena', async () => {
    const response = await handler({
      pathParameters: null,
      body: JSON.stringify({}),
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('id_colmena es obligatorio');
  });

  test('retorna 400 si el cuerpo no es JSON válido', async () => {
    const response = await handler({
      pathParameters: { id: '1' },
      body: '{invalidJson}',
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('El cuerpo de la solicitud no es un JSON válido');
  });

  test('retorna 400 si faltan campos obligatorios', async () => {
    const response = await handler({
      pathParameters: { id: '1' },
      body: JSON.stringify({
        nombre: 'Colmena A',
        fecha_instalacion: null,
        longitud: -76.9,
        latitud: -12.1,
      }),
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe('nombre, fecha_instalacion, longitud y latitud son obligatorios');
  });

  test('retorna 404 si no se encuentra la colmena', async () => {
    // Simula: primero busca (no encuentra), no llega a update
    executeMock.mockResolvedValueOnce([[], []]);
    const response = await handler({
      pathParameters: { id: '1' },
      body: JSON.stringify({
        nombre: 'Colmena A',
        fecha_instalacion: '2024-01-01',
        imagen_url: 'http://img.com/image.jpg',
        id_sensores: 'ABC123',
        longitud: -76.9,
        latitud: -12.1,
      }),
    });
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).error).toBe('Colmena no encontrada');
  });

  test('retorna 200 si actualiza correctamente', async () => {
    const mockColmena = {
      id_colmena: 1,
      nombre: 'Colmena A',
      fecha_instalacion: '2024-01-01T00:00:00.000Z',
      imagen_url: 'http://img.com/image.jpg',
      id_sensores: 'ABC123',
      longitud: -76.9,
      latitud: -12.1,
    };
    // Simula: primero busca (encuentra), luego update
    executeMock.mockResolvedValueOnce([[mockColmena], []]); // búsqueda
    executeMock.mockResolvedValueOnce([{}, []]); // update
    executeMock.mockResolvedValueOnce([[mockColmena], []]); // select final
    const response = await handler({
      pathParameters: { id: '1' },
      body: JSON.stringify({
        nombre: 'Colmena A',
        fecha_instalacion: '2024-01-01',
        imagen_url: 'http://img.com/image.jpg',
        id_sensores: 'ABC123',
        longitud: -76.9,
        latitud: -12.1,
      }),
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).colmena).toEqual(mockColmena);
  });

  test('retorna 500 en caso de error interno', async () => {
    // Simula: error en la búsqueda
    executeMock.mockRejectedValueOnce(new Error('Fallo de conexión'));
    const response = await handler({
      pathParameters: { id: '1' },
      body: JSON.stringify({
        nombre: 'Colmena A',
        fecha_instalacion: '2024-01-01',
        imagen_url: 'http://img.com/image.jpg',
        id_sensores: 'ABC123',
        longitud: -76.9,
        latitud: -12.1,
      }),
    });
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toMatch(/Fallo de conexión/);
  });

  test('retorna 500 si el mock no devuelve array en update', async () => {
    // Simula: update devuelve undefined (error de mock)
    executeMock.mockResolvedValueOnce([[{ id_colmena: 1 }], []]); // búsqueda (simula que existe)
    executeMock.mockResolvedValueOnce(undefined); // update (mal mock)
    const response = await handler({
      pathParameters: { id: '1' },
      body: JSON.stringify({
        nombre: 'Colmena A',
        fecha_instalacion: '2024-01-01',
        imagen_url: 'http://img.com/image.jpg',
        id_sensores: 'ABC123',
        longitud: -76.9,
        latitud: -12.1,
      }),
    });
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).error).toMatch(/resultado inesperado de la base de datos/);
  });
});
