import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["**/*.ts", "**/*.js"],
    ignores: ["dist/", "node_modules/"], // Ignore output and dependencies
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser,
      globals: {
        ...globals.node, // Enables Node.js global variables
        ...globals.es2021 // Enables ES2021 global variables
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn",
      "no-debugger": "error"
    }
  }
];
