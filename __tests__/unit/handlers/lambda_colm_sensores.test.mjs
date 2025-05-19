// __tests__/unit/handlers/lambda_colm_sensores.test.mjs
import { jest } from '@jest/globals';

// Configuración global
jest.setTimeout(30000); // Aumentamos el timeout global

// Helpers para pruebas
const generateMockRow = (overrides = {}) => ({
  colmena: 'colmena_default',
  _field: 'humedad',
  _value: 50,
  _time: new Date().toISOString(),
  ...overrides
});

expect.extend({
  toBeNullOrNumber(received) {
    const pass = received === null || typeof received === 'number';
    if (pass) {
      return {
        message: () => `expected ${received} not to be null or number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be null or number`,
        pass: false,
      };
    }
  }
});

const expectedResponseStructure = {
  id_colmena: expect.any(String),
  nombre: expect.any(String),
  humedad: expect.toBeNullOrNumber(),
  temperatura: expect.toBeNullOrNumber(),
  peso: expect.toBeNullOrNumber(),
  longitud: expect.toBeNullOrNumber(),
  latitud: expect.toBeNullOrNumber()
};

describe('Lambda Handler', () => {
  let handler;
  let mockQueryApi;
  let originalEnv;
  let mockInfluxDB;

  beforeAll(async () => {
    // Guardar y configurar environment
    originalEnv = { ...process.env };
    process.env.INFLUX_URL = 'http://mock-url';
    process.env.INFLUX_TOKEN = 'mock-token';
    process.env.INFLUX_ORG = 'mock-org';
    process.env.INFLUX_BUCKET = 'mock-bucket';

    // Mock completo de InfluxDB con mayor control
    jest.unstable_mockModule('@influxdata/influxdb-client', () => {
      const mockQueryApiInstance = {
        queryRows: jest.fn()
      };

      const mockInfluxDBInstance = {
        getQueryApi: jest.fn(() => mockQueryApiInstance),
        ping: jest.fn().mockResolvedValue({ status: 'ready' }) // Mock por defecto para éxito
      };

      return {
        InfluxDB: jest.fn(() => mockInfluxDBInstance),
        flux: {
          DateTime: jest.fn().mockImplementation((time) => ({ toISOString: () => time }))
        }
      };
    });

    // Importaciones dinámicas
    const influxModule = await import('@influxdata/influxdb-client');
    const module = await import('../../../src/functions/colmSensoresFunction/lambda_colm_sensores.mjs');

    handler = module.handler;
    mockInfluxDB = new influxModule.InfluxDB();
    mockQueryApi = mockInfluxDB.getQueryApi();
  });

  afterAll(() => {
    // Restaurar environment
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuración por defecto para consultas vacías
    mockQueryApi.queryRows.mockImplementation((query, { complete }) => {
      setImmediate(() => complete());
      return Promise.resolve();
    });
    mockInfluxDB.ping.mockResolvedValue({ status: 'ready' });
  });

  describe('Successful queries', () => {
    test('should return formatted data for successful query', async () => {
      const mockData = [
        generateMockRow({ colmena: 'colmena_A1', _field: 'humedad', _value: 65 }),
        generateMockRow({ colmena: 'colmena_A1', _field: 'temperatura', _value: 22 }),
        generateMockRow({ colmena: 'colmena_B2', _field: 'peso', _value: 45 })
      ];

      mockQueryApi.queryRows.mockImplementation((query, { next, complete }) => {
        setImmediate(() => {
          mockData.forEach(row => next(row, { toObject: () => row }));
          complete();
        });
        return Promise.resolve();
      });

      const result = await handler({});
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body).toEqual(expect.any(Array));
      body.forEach(item => {
        expect(item).toMatchObject(expectedResponseStructure);
      });
    });

    test('should correctly parse colmena name without prefix', async () => {
      const mockData = [
        generateMockRow({ colmena: 'colmena_1', _field: 'humedad', _value: 70 })
      ];

      mockQueryApi.queryRows.mockImplementation((query, { next, complete }) => {
        setImmediate(() => {
          mockData.forEach(row => next(row, { toObject: () => row }));
          complete();
        });
        return Promise.resolve();
      });

      const result = await handler({});
      const body = JSON.parse(result.body);
      expect(body[0]).toMatchObject({
        id_colmena: '1',
        nombre: 'colmena_1'
      });
    });
  });

  describe('Error handling', () => {
    test('should return 404 with default data for empty query result', async () => {
      mockQueryApi.queryRows.mockImplementation((query, { complete }) => {
        setImmediate(() => complete());
        return Promise.resolve();
      });

      const result = await handler({});
      expect(result.statusCode).toBe(404);
    });

    test('should return 500 for query error', async () => {
      mockQueryApi.queryRows.mockImplementation((query, { error }) => {
        setImmediate(() => error(new Error('Query failed')));
        return Promise.resolve();
      });

      const result = await handler({});
      expect(result.statusCode).toBe(500);
    });

    test('should handle connection errors with 503 status', async () => {
      // Sobrescribir el mock de ping para simular error de conexión
      mockInfluxDB.ping.mockRejectedValue(new Error('ECONNREFUSED: Connection failed'));

      const result = await handler({});
      const body = JSON.parse(result.body);

      // Verificaciones
      expect(result.statusCode).toBe(503);
      expect(body).toEqual({
        message: 'Error de conexión con InfluxDB.',
        details: 'ECONNREFUSED: Connection failed'
      });

      // Verificar que no se llamó a queryRows cuando falla la conexión
      expect(mockQueryApi.queryRows).not.toHaveBeenCalled();
    }, 10000);

  });

  describe('Performance', () => {
    test('should respond within reasonable time', async () => {
      const start = Date.now();
      const result = await handler({});
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });
});