module.exports = {
  testEnvironment: 'jsdom',

  // Путь к setup файлам
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],

  // Паттерны для поиска тестов
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],

  // Модули для трансформации
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Мокирование модулей
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Покрытие кода
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/*.stories.{ts,tsx}'
  ],

  // Пороги покрытия
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Очистка моков между тестами
  clearMocks: true,
  restoreMocks: true
};
