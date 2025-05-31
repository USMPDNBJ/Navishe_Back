import { jest } from '@jest/globals';

// Mock global para SNSClient y su método send
const sendMock = jest.fn();
jest.mock('mysql2/promise', () => ({
    createConnection: jest.fn()
}));
jest.mock('@aws-sdk/client-sns', () => {
    return {
        SNSClient: jest.fn(() => ({
            send: sendMock
        })),
        PublishCommand: jest.fn() // <--- agrega esto
    };
});

import { SNSClient } from '@aws-sdk/client-sns';
import { handler } from '../../../src/functions/snsUbicacionFunction/lambda_sns_ubicacion.mjs';
import mysql from 'mysql2/promise';

describe('lambda_sns_ubicacion', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        mysql.createConnection = jest.fn();
        sendMock.mockReset();
    });

    test('debe retornar error si falta topic o ubicacion', async () => {
        const event = { topic: 'colmena_XYZ0' };
        const res = await handler(event);
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body).message).toMatch(/Missing topic or ubicacion/);
    });

    test('debe retornar error si la ubicacion es invalida', async () => {
        const event = { topic: 'colmena_XYZ0', ubicacion: 'abc,def' };
        const res = await handler(event);
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body).message).toMatch(/Failed to parse location string/);
    });

    test('debe retornar error si no hay datos en MySQL', async () => {
        mysql.createConnection.mockResolvedValue({
            execute: jest.fn().mockResolvedValue([[]]),
            end: jest.fn(),
        });
        const event = { topic: 'colmena_XYZ0', ubicacion: '10,20' };
        const res = await handler(event);
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body).message).toMatch(/No location data found/);
    });

    test('debe retornar sin notificación si la distancia es <= 1m', async () => {
        mysql.createConnection.mockResolvedValue({
            execute: jest.fn().mockResolvedValue([[{ latitud: 10, longitud: 20 }]]),
            end: jest.fn(),
        });
        const event = { topic: 'colmena_XYZ0', ubicacion: '10,20' };
        const res = await handler(event);
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body).status).toBe('No notification needed');
    });


        // test('debe enviar notificación SNS si la distancia es > 1m', async () => {
        //     mysql.createConnection.mockResolvedValue({
        //         execute: jest.fn().mockImplementation(() => [[{ latitud: 10, longitud: 20 }]]),
        //         end: jest.fn(),
        //     });
        //     sendMock.mockResolvedValue({});
        //     const { handler } = await import('../../../src/functions/snsUbicacionFunction/lambda_sns_ubicacion.mjs');
        //     const event = { topic: 'colmena_CristopherNieves0', ubicacion: '10.0002,20.0002' }; // topic consistente con lógica
        //     const res = await handler(event);
        //     expect(res.statusCode).toBe(200);
        //     expect(JSON.parse(res.body).status).toBe('Notification sent');
        //     expect(sendMock).toHaveBeenCalled();
        // });

        // test('debe retornar error si SNS falla', async () => {
        //     mysql.createConnection.mockResolvedValue({
        //         execute: jest.fn().mockImplementation(() => [[{ latitud: 10, longitud: 20 }]]),
        //         end: jest.fn(),
        //     });
        //     sendMock.mockRejectedValue(new Error('SNS fail'));
        //     const { handler } = await import('../../../src/functions/snsUbicacionFunction/lambda_sns_ubicacion.mjs');
        //     const event = { topic: 'colmena_CristopherNieves0', ubicacion: '10.0002,20.0002' }; // topic consistente con lógica
        //     const res = await handler(event);
        //     expect(res.statusCode).toBe(500);
        //     expect(JSON.parse(res.body).message).toMatch(/SNS error/);
        //     expect(sendMock).toHaveBeenCalled();
        // });

});
