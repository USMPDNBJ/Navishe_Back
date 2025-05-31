// hello-world/app.test.mjs
import { jest } from '@jest/globals';
import mysql from 'mysql2/promise';
import { handler } from '../../../../Navishe_Back/src/functions/cameraFindId/lambda_camera_find_id.mjs';

// Mock de mysql2/promise
jest.mock('mysql2/promise');

describe('handler', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            execute: jest.fn(),
            end: jest.fn()
        };

        mysql.createConnection = jest.fn().mockResolvedValue(mockConnection);
    });

    test('debe retornar 400 si no se pasa id', async () => {
        const event = {
            queryStringParameters: {}
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Missing id query parameter.');
    });

    test('debe retornar 404 si no encuentra la cámara', async () => {
        const event = {
            queryStringParameters: { id: '9999' }
        };

        mockConnection.execute.mockResolvedValue([[], []]);

        const result = await handler(event);

        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toMatch(/No camera found/);
    });

    test('debe retornar 200 si encuentra la cámara', async () => {
        const event = {
            queryStringParameters: { id: '1' }
        };

        const fakeData = [{
            id: 1,
            nombre: 'Camara 1',
            url_camera: 'http://camara.existe'
        }];

        mockConnection.execute.mockResolvedValue([fakeData, []]);

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.message).toBe('Camera retrieved successfully');
        expect(body.data).toEqual(fakeData[0]);
    });

    test('debe retornar 500 si ocurre un error en la base de datos', async () => {
        const event = {
            queryStringParameters: { id: '1' }
        };

        mockConnection.execute.mockRejectedValue(new Error('DB error'));

        const result = await handler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toBe('Error retrieving camera');
    });
});
