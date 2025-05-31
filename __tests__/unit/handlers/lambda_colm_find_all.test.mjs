// __tests__/unit/handlers/colm_find_all.test.mjs
import { jest } from '@jest/globals';
import { createHandler } from '../../../src/functions/colmFindAllFunction/lambda_colm_find_all.mjs';

const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockCreateConnection = jest.fn(() => ({
  execute: mockExecute,
  end: mockEnd
}));

const mockMysql = {
  createConnection: mockCreateConnection,
};

describe('handler - MySQL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return beehives data successfully', async () => {
    const mockData = [
      {
        id_colmena: 1,
        nombre: 'Colmena A',
        fecha_instalacion: '2023-01-01',
        imagen_url: 'https://example.com/image.jpg',
        id_sensores: 101,
      }
    ];
    mockExecute.mockResolvedValueOnce([mockData]);

    const handler = createHandler(mockMysql);
    const response = await handler();

    expect(mockCreateConnection).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).data).toEqual(mockData);
  });

  it('should handle errors', async () => {
    mockCreateConnection.mockRejectedValueOnce(new Error('Connection failed'));

    const handler = createHandler(mockMysql);
    const response = await handler();

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error retrieving beehives');
    expect(body.error).toBe('Connection failed');
  });
});
