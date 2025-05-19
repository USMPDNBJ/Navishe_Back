
import { jest } from '@jest/globals';
// Mock de MSSQL
jest.mock('mssql', () => {
  const requestMock = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
  };

  return {
    connect: jest.fn(),
    close: jest.fn(),
    Int: 'Int',
    VarChar: 'VarChar',
    DateTime: 'DateTime',
    Float: 'Float',
    request: jest.fn(() => requestMock),
    __requestMock: requestMock, // acceso externo opcional
  };
});

const sqlModule = await import('mssql');
const sql = sqlModule.default;
const { handler } = await import('../../../src/handlers/colmUpdateFunction/lambda_colm_update.mjs');

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
    sql.connect.mockResolvedValueOnce(sql);
    sql.request().query.mockResolvedValueOnce({ recordset: [] });

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

    sql.connect.mockResolvedValueOnce(sql);
    sql.request().query.mockResolvedValueOnce({ recordset: [mockColmena] });

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
    sql.connect.mockRejectedValueOnce(new Error('Fallo de conexión'));

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
});
