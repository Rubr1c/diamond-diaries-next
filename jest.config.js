// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/src/tests/**/*.test.{js,jsx,ts,tsx}'], // Matches your tests in src/tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // --- SonarQube Coverage Configuration ADDED ---
  collectCoverage: true,                             // Enable coverage collection
  coverageReporters: ['lcov', 'text', 'text-summary'], // MUST include 'lcov' for SonarQube
  collectCoverageFrom: [                              // Define files TO measure coverage FOR
    '<rootDir>/src/**/*.{js,jsx,ts,tsx}',             // Include all code in src
    '!<rootDir>/src/tests/**',                      // IMPORTANT: Exclude the tests themselves
    '!<rootDir>/src/**/*.d.ts',                       // Exclude type definition files
    '!<rootDir>/src/**/index.{js,jsx,ts,tsx}',        // Often exclude index/barrel files
    '!**/node_modules/**',                          // Exclude dependencies
    '!<rootDir>/.next/**',                          // Exclude Next.js build output
    '!<rootDir>/*.config.js',                        // Exclude config files (like this one)
    '!<rootDir>/coverage/**',                      // Exclude coverage output itself
    // Add any other specific files or patterns to exclude from coverage metrics
  ],
  // --- End of SonarQube Coverage Configuration ---
};

module.exports = createJestConfig(customJestConfig);