import { jest } from '@jest/globals';

describe('handler - lambda_trabajadores_delete (MySQL)', () => {
  let mockExecute;
  let mockEnd;
  let mockCreateConnection;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 when worker is deleted successfully', async () => {
    mockExecute = jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockEnd = jest.fn();
    mockCreateConnection = jest.fn().mockResolvedValue({
      execute: mockExecute,
      end: mockEnd,
    });
    jest.unstable_mockModule('mysql2/promise', () => ({
      createConnection: mockCreateConnection,
    }));
    const { handler } = await import('../../../src/functions/trabajadorDeleteFunction/lambda_trabajadores_delete.mjs');
    const mockEvent = {
      body: JSON.stringify({ id_trabajador: 10 }),
    };
    const response = await handler(mockEvent, {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Worker deleted successfully');
  });

  it('should return 404 when worker not found', async () => {
    mockExecute = jest.fn().mockResolvedValueOnce([{ affectedRows: 0 }]);
    mockEnd = jest.fn();
    mockCreateConnection = jest.fn().mockResolvedValue({
      execute: mockExecute,
      end: mockEnd,
    });
    jest.unstable_mockModule('mysql2/promise', () => ({
      createConnection: mockCreateConnection,
    }));
    const { handler } = await import('../../../src/functions/trabajadorDeleteFunction/lambda_trabajadores_delete.mjs');
    const mockEvent = {
      body: JSON.stringify({ id_trabajador: 999 }),
    };
    const response = await handler(mockEvent, {});
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Worker not found');
  });

  it('should return 400 if id_trabajador is missing', async () => {
    mockExecute = jest.fn();
    mockEnd = jest.fn();
    mockCreateConnection = jest.fn().mockResolvedValue({
      execute: mockExecute,
      end: mockEnd,
    });
    jest.unstable_mockModule('mysql2/promise', () => ({
      createConnection: mockCreateConnection,
    }));
    const { handler } = await import('../../../src/functions/trabajadorDeleteFunction/lambda_trabajadores_delete.mjs');
    const mockEvent = { body: JSON.stringify({}) };
    const response = await handler(mockEvent, {});
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('id_trabajador is required');
  });

  it('should return 500 on unexpected error', async () => {
    mockExecute = jest.fn().mockRejectedValueOnce(new Error('DB connection failed'));
    mockEnd = jest.fn();
    mockCreateConnection = jest.fn().mockResolvedValue({
      execute: mockExecute,
      end: mockEnd,
    });
    jest.unstable_mockModule('mysql2/promise', () => ({
      createConnection: mockCreateConnection,
    }));
    jest.resetModules(); // <-- Esto es clave para ESM y mocks
    const { handler } = await import('../../../src/functions/trabajadorDeleteFunction/lambda_trabajadores_delete.mjs');
    const mockEvent = {
      body: JSON.stringify({ id_trabajador: 5 }),
    };
    const response = await handler(mockEvent, {});
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('DB connection failed');
  });
});