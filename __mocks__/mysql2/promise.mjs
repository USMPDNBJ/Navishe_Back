// Mock ESM para mysql2/promise compatible con Jest y dynamic import
const executeMock = jest.fn();
const endMock = jest.fn();

const connectionMock = {
  execute: executeMock,
  end: endMock,
};

// Exportamos tanto por default como named
export default {
  createConnection: jest.fn(() => connectionMock),
  __executeMock: executeMock,
};
export const createConnection = jest.fn(() => connectionMock);
export const __executeMock = executeMock;
