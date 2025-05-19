import { jest } from '@jest/globals';

// 🔧 Mocks necesarios para simular sql.connect y request/input/query
const mockQuery = jest.fn();
const mockInput = jest.fn().mockReturnThis();
const mockRequest = () => ({
  input: mockInput,
  query: mockQuery,
});
const mockClose = jest.fn();
const mockConnect = jest.fn();

// 📦 Mock del módulo 'mssql'
jest.unstable_mockModule('mssql', () => ({
  default: {
    connect: mockConnect,
    VarChar: 'VarChar',
    Bit: 'Bit',
    DateTime: 'DateTime',
  },
  connect: mockConnect,
  VarChar: 'VarChar',
  Bit: 'Bit',
  DateTime: 'DateTime',
}));

// ⚠️ Importar después del mock
const { handler } = await import('../../../src/functions/trabajadorCreateFunction/lambda_trabajadores_create.mjs');

describe('handler - lambda_trabajadores_create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 when worker is created successfully', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '87654321',
      }),
    };

    const mockContext = {
      awsRequestId: 'test-id-123',
    };

    // ✅ Simula que el DNI no existe y la inserción se realiza correctamente
    mockQuery
      .mockResolvedValueOnce({ recordset: [{ count: 0 }] }) // Consulta de verificación de DNI
      .mockResolvedValueOnce({}); // Inserción

    mockConnect.mockResolvedValueOnce({
      request: mockRequest,
      close: mockClose,
    });

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Worker created successfully');
    expect(body.id_trabajador).toBe('test-id-123');
  });

  it('should return 409 if DNI already exists', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '87654321',
      }),
    };

    const mockContext = {
      awsRequestId: 'test-id-456',
    };

    // Simula que el DNI ya existe
    mockQuery.mockResolvedValueOnce({ recordset: [{ count: 1 }] });

    mockConnect.mockResolvedValueOnce({
      request: mockRequest,
      close: mockClose,
    });

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('DNI already exists');
  });

  it('should return 400 if email is invalid', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo-malo',
        nombre: 'Miguel',
        dni: '87654321',
      }),
    };

    const response = await handler(mockEvent, {});

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Invalid email format');
  });

  it('should return 400 if DNI is not 8 digits', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '123',
      }),
    };

    const response = await handler(mockEvent, {});

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('DNI must be 8 digits');
  });

  it('should return 400 if required field is missing', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        // falta el campo dni
      }),
    };

    const response = await handler(mockEvent, {});

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Missing required field: dni');
  });

  it('should return 500 on unexpected error', async () => {
    const mockEvent = {
      body: JSON.stringify({
        contrasena: 'abc123',
        rol: 'admin',
        correo: 'correo@example.com',
        nombre: 'Miguel',
        dni: '87654321',
      }),
    };

    const mockContext = {
      awsRequestId: 'test-id',
    };

    mockConnect.mockRejectedValueOnce(new Error('Unexpected failure'));

    const response = await handler(mockEvent, mockContext);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Unexpected failure');
  });
});
