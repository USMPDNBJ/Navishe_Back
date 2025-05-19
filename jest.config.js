// jest.config.js
export default {
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test).mjs'],
  modulePathIgnorePatterns: [".aws-sam/",'src/functions/colmSensoresFunction/',]
};