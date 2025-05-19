// lambda_conexion_db_data_panales.test.js
import { jest } from '@jest/globals';
import { handler } from '../../../src/functions/conexionDBFunction/lambda_conexion_db.mjs';

// Mockear el módulo
jest.unstable_mockModule('@influxdata/influxdb-client', () => {
    const mockWriteApi = {
        writePoint: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
    };

    return {
        InfluxDB: jest.fn(() => ({
            getWriteApi: jest.fn(() => mockWriteApi)
        })),
        Point: jest.fn(() => ({
            tag: jest.fn().mockReturnThis(),
            floatField: jest.fn().mockReturnThis(),
            timestamp: jest.fn().mockReturnThis()
        }))
    };
});

describe('handler', () => {
    it('debe procesar correctamente un evento y escribir datos en InfluxDB', async () => {
        const fakeEvent = {
            humedad: "55.2",
            temperatura: "35.6",
            ubicacion: "19.4326,-99.1332",
            peso: "8.5",
            topic: "colmena/123"
        };

        const response = await handler(fakeEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Datos escritos en InfluxDB');
    });

    it('debe manejar errores y retornar código 500', async () => {
        const fakeEvent = {
            humedad: "no es un número",
            temperatura: "35.6",
            ubicacion: "19.4326,-99.1332",
            peso: "8.5",
            topic: "colmena/123"
        };

        const response = await handler(fakeEvent);

        expect(response.statusCode).toBe(500);
        expect(response.body).toContain('Error al procesar el mensaje');
    });
});
