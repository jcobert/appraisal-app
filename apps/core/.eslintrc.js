/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    'next',
    'plugin:tailwindcss/recommended',
    '@repo/eslint-config/next',
  ],
  plugins: ['@typescript-eslint', 'unused-imports'],
  parserOptions: {
    babelOptions: {
      presets: [require.resolve('next/babel')],
    },
  },
  rules: {
    'tailwindcss/no-custom-classname': 'off',
    'testing-library/prefer-screen-queries': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'tailwindcss/classnames-order': 'off',
    'no-duplicate-imports': 'error',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-curly-brace-presence': [
      'warn',
      { props: 'never', children: 'never' },
    ],
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // Types like RequestInit are compile-time only; avoid false positives
        'no-undef': 'off',
      },
    },
  ],
}
