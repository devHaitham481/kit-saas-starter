import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs["flat/recommended"],
  prettier,
  ...svelte.configs["flat/prettier"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    ignores: ["build/", ".svelte-kit/", "package/", "eslint.config.js", "src/lib/paraglide"]
  },
  {
    rules: {
      // TODO delete this line when the following PR will be merged
      // https://github.com/sveltejs/eslint-plugin-svelte/issues/348
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^\\$\\$(Props|Events|Slots)$" }],
      // TODO this should be deleted, it's a known bug
      // https://github.com/sveltejs/eslint-plugin-svelte/issues/652
      "svelte/valid-compile": "off"
    }
  }
];
