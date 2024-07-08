export default {
    transform: {
      "^.+\\.m?js$": "babel-jest", // Ensure both .js and .mjs files are transformed
    },
    testEnvironment: "node",
    moduleFileExtensions: ["js", "mjs"], // Recognize .mjs extensions
    testMatch: ["**/tests/**/*.mjs"], // Adjust to match your test file pattern
  };
  