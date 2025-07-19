/** @type {import("eslint").Linter.Config} */
module.exports = {
  plugins: ['@typescript-eslint', 'unused-imports'],
  extends: [
    'next',
    'prettier',
    // 'react-app',
    // 'react-app/jest',
    'plugin:react-hooks/recommended',
    'plugin:tailwindcss/recommended',
  ],
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
    'react-hooks/exhaustive-deps': 'off',
    'react/jsx-curly-brace-presence': [
      'warn',
      { props: 'never', children: 'never' },
    ],
    'no-console': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
}
