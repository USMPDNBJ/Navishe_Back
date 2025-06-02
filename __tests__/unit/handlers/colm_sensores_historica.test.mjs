// lambda_colm_sensores_historica.test.mjs

import { jest } from '@jest/globals'; // ✅ necesario en .mjs
import { handler } from '../../../src/functions/colmSensoresHistoricaFunction/lambda_colm_sensores_historica.mjs';
import { InfluxDB } from '@influxdata/influxdb-client';

// Mocks
const mockQueryRows = jest.fn();

jest.unstable_mockModule('@influxdata/influxdb-client', () => ({
  InfluxDB: jest.fn().mockImplementation(() => ({
    getQueryApi: () => ({
      queryRows: mockQueryRows,
    }),
  })),
}));

// Reimporta después de mockear (por comportamiento de ESM)
const { handler: mockedHandler } = await import(
  '../../../src/functions/colmSensoresHistoricaFunction/lambda_colm_sensores_historica.mjs'
);

describe('Tests para handler (unitarias e integración)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Retorna error si faltan parámetros', async () => {
    const event = {};
    const response = await mockedHandler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/faltan parámetros/i);
  });

  test('Retorna error si fechas inválidas', async () => {
    const event = { id: '1', startDate: 'invalid', endDate: 'invalid' };
    const response = await mockedHandler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toMatch(/fecha inválido/i);
  });

  test('Consulta real a InfluxDB devuelve datos', async () => {
    const event = {
      id: 'colmena1',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-02T00:00:00Z'
    };

    // OJO: Aquí se puede usar handler sin mocks
    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body).toHaveProperty('humedad');
    expect(body.humedad.data.length).toBeGreaterThan(0);
  }, 15000);
});



//test('Retorna 404 si no hay datos para el rango de fechas dado', async () => {
//  const event = {
//    id: 'colmena1',
//    startDate: '1990-01-01T00:00:00Z', // Fecha fuera del rango posible
//    endDate: '1990-01-02T00:00:00Z'
//  };
//
//  const response = await handler(event);
//
//  expect(response.statusCode).toBe(404);
//  const body = JSON.parse(response.body);
//  expect(body.message).toMatch(/no se encontraron datos/i);
//});