export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).mjs'],
  transform: {},
  modulePathIgnorePatterns: [".aws-sam/",'src/functions/colmSensoresFunction/',]
};
