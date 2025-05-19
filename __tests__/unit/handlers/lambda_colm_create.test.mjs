import { jest } from '@jest/globals';


const mockRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn().mockResolvedValue({ recordset: [] })
};

const mockPool = {
  request: jest.fn(() => mockRequest),
  close: jest.fn().mockResolvedValue()
};

const mockConnect = jest.fn().mockResolvedValue(mockPool);

jest.unstable_mockModule('mssql', () => ({
  connect: mockConnect,
  Request: jest.fn(() => mockRequest),
  NVarChar: 'NVarChar',
  DateTime: 'DateTime',
  Float: 'Float',
}));


import sql from 'mssql';
import { handler } from '../../../src/handlers/lambda_colm_create.mjs';



describe('Lambda colm_create Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(mockPool);
    mockRequest.query.mockResolvedValue({ recordset: [] });
  });

  it('should create a colmena successfully', async () => {
    const event = {
      nombre: 'Colmena Test',
      fecha_instalacion: '2025-05-19T00:00:00Z',
      imagen_url: 'https://example.com/colmena.jpg',
      id_sensores: 'sensor123',
      longitud: -76.123456,
      latitud: -12.123456
    };
    console.log('sql.connect is mock:', jest.isMockFunction(sql.connect));
    const response = await handler(event);
    console.log("EVENTO", response);
    const body = JSON.parse(response.body);
    console.log("BODY", body.data);
    expect(response.statusCode).toBe(200);
    console.log("STATUS", response.statusCode);
    expect(body.message).toBe('Colmena creada exitosamente');
    console.log("MSG", body.message);
    // expect(sql.connect).toHaveBeenCalled();
    // expect(mockPool.request).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockConnect.mockRejectedValueOnce(new Error('Connection failed'));

    const event = {
      nombre: 'Colmena Test',
      fecha_instalacion: '2025-05-19T00:00:00Z',
      id_sensores: 'sensor123',
      longitud: -76.123456,
      latitud: -12.123456
    };
    mockRequest.query.mockRejectedValue(new Error("Base de datos caída"));
    const response = await handler(event);
    expect(response.statusCode).toBe(400);
  });
});
