module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/jest/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "./coverage",
  coverageReporters: [
    "json-summary",
    "text",
    "lcov"
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
