import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  {
    files: ['**/*.ts'],
    extends: tseslint.configs.recommended,
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'chrome',
          message: 'Keep src/core portable; access chrome APIs through UI or storage adapters.'
        }
      ]
    }
  },
  {
    files: ['src/storage/**/*.ts'],
    ignores: ['src/storage/chromeStorage.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'chrome',
          message: 'Keep portable storage code chrome-free; isolate chrome APIs in chromeStorage.ts.'
        }
      ]
    }
  }
);
