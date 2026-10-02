import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '.claude/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.mjs', '**/scripts/**'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['packages/core/src/**/*.ts'],
    ignores: ['packages/core/src/three/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['three', 'three/*', 'lit', 'lit/*'],
              message:
                'Core bleibt frei von three.js und UI. Nur core/three darf three importieren.',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'document', 'window', 'HTMLElement'],
    },
  },
  prettier,
);
