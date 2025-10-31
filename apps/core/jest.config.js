const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testPathIgnorePatterns: ['<rootDir>/e2e'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@repo/ui/(.*)$': '<rootDir>/../../packages/ui/src/components/$1',
    '^@repo/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@repo/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^@repo/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@repo/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
    '^@repo/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@repo/database/(.*)$': '<rootDir>/../../packages/database/src/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(uncrypto|@kinde-oss)/)'],
}

module.exports = createJestConfig(customJestConfig)
