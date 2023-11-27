module.exports = {
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.eslint.json'
  },
  ignorePatterns: [
    'jest.config.ts',
    'dist',
    'node_modules',
    'gen'
  ]
}
