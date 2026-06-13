module.exports = [
  {
    ignores: ["node_modules/**", "coverage/**", "public/js/dompurify.min.js"]
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        // Node.js globals
        process: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        // Jest globals
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        DOMPurify: "readonly",
        App: "writable"
      }
    },
    rules: {
      "no-console": "warn",
      "semi": ["error", "always"],
      "quotes": ["error", "single"]
    }
  }
];
