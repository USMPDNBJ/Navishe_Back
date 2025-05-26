export default {
  testEnvironment: 'node',
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testMatch: ['**/__tests__/**/*.test.mjs'],
  testPathIgnorePatterns: ['/node_modules/', '/.aws-sam/'],
  resolver: undefined,
};
