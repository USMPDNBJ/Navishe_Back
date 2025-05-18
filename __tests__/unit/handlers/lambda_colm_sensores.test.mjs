// __tests__/unit/handlers/lambda_colm_sensores.test.mjs
import { jest } from '@jest/globals';

describe('Lambda Handler', () => {
  let handler;
  let mockQueryApi;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock más simple y directo
    jest.unstable_mockModule('@influxdata/influxdb-client', () => ({
      InfluxDB: jest.fn(() => ({
        getQueryApi: jest.fn(() => ({
          queryRows: jest.fn()
        }))
      }))
    }));

    // Importar el handler
    const module = await import('../../../src/functions/colmSensoresFunction/lambda_colm_sensores.mjs');
    handler = module.handler;

    // Obtener el mock
    const { InfluxDB } = await import('@influxdata/influxdb-client');
    mockQueryApi = new InfluxDB().getQueryApi();
  });

  test('should return formatted data for successful query', async () => {
    const mockRows = [
      {
        colmena: 'colmena_A1',
        _field: 'humedad',
        _value: 65,
        _time: '2025-05-18T10:00:00Z',
      },
      {
        colmena: 'colmena_A1',
        _field: 'temperatura',
        _value: 22,
        _time: '2025-05-18T10:00:00Z',
      },
      {
        colmena: 'colmena_B2',
        _field: 'peso',
        _value: 45,
        _time: '2025-05-18T10:00:00Z',
      },
    ];

    mockQueryApi.queryRows.mockImplementation((query, { next, error, complete }) => {
      console.log('Mock queryRows called with query:', query);
      // Simular comportamiento asíncrono
      process.nextTick(() => {
        mockRows.forEach((row) => {
          console.log('Calling next with row:', row);
          next(row, { toObject: jest.fn().mockReturnValue(row) });
        });
        console.log('Calling complete');
        complete();
      });
    });

    const result = await handler({});
    console.log('Result:', result); // Depuración

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([
      {
        id_colmena: '1',
        nombre: 'colmena_A1',
        humedad: 65,
        temperatura: 22,
        peso: null,
        longitud: null,
        latitud: null,
      },
      {
        id_colmena: '2',
        nombre: 'colmena_B2',
        humedad: null,
        temperatura: null,
        peso: 45,
        longitud: null,
        latitud: null,
      },
    ]);
    expect(mockQueryApi.queryRows).toHaveBeenCalled();
  }, 10000);

  test('should return 404 with default data for empty query result', async () => {
    mockQueryApi.queryRows.mockImplementation((query, { next, error, complete }) => {
      console.log('Mock queryRows called with query:', query); // Depuración
      console.log('Calling complete for empty result'); // Depuración
      complete();
    });

    const result = await handler({});
    console.log('Result:', result); // Depuración

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'No se encontraron datos.' });
    expect(mockQueryApi.queryRows).toHaveBeenCalled();
  }, 10000);

  test('should return 500 for query error', async () => {
    mockQueryApi.queryRows.mockImplementation((query, { next, error, complete }) => {
      console.log('Mock queryRows called with query:', query); // Depuración
      console.log('Calling error'); // Depuración
      error(new Error('Query failed'));
    });

    const result = await handler({});
    console.log('Result:', result); // Depuración

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: 'Error al consultar InfluxDB.' });
    expect(mockQueryApi.queryRows).toHaveBeenCalled();
  }, 10000);

  test('should correctly parse colmena name without prefix', async () => {
    const mockRows = [
      {
        colmena: 'colmena_1',
        _field: 'humedad',
        _value: 70,
        _time: '2025-05-18T10:00:00Z',
      },
    ];

    mockQueryApi.queryRows.mockImplementation((query, { next, error, complete }) => {
      console.log('Mock queryRows called with query:', query); // Depuración
      mockRows.forEach((row) => {
        console.log('Calling next with row:', row); // Depuración
        next(row, { toObject: jest.fn().mockReturnValue(row) });
      });
      console.log('Calling complete'); // Depuración
      complete();
    });

    const result = await handler({});
    console.log('Result:', result); // Depuración

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual([
      {
        id_colmena: '1',
        nombre: 'colmena_1',
        humedad: 70,
        temperatura: null,
        peso: null,
        longitud: null,
        latitud: null,
      },
    ]);
    expect(mockQueryApi.queryRows).toHaveBeenCalled();
  }, 10000);
});