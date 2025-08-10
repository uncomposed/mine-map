import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // 1) Global ignores so bundles/minified code aren't linted
  { ignores: ['dist/**', 'node_modules/**'] },

  // 2) Base recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3) Project rules for our source and tests only
  {
    files: ['src/**/*.{ts,tsx,js,mjs,cjs}', 'tests/**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      // Add project-specific rules here if needed
    }
  },

  // 4) Turn off rules that conflict with Prettier's formatting
  eslintConfigPrettier
];
