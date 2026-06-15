module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^lucide-react$": "<rootDir>/src/__mocks__/lucide-react.js"
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
};
