module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parser: '@babel/eslint-parser',
  extends: ['airbnb-base', 'prettier'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    semi: ['error', 'never'],
    'func-names': ['warn', 'never'],
    'class-methods-use-this': ['off'],
    'no-underscore-dangle': ['off'],
  },
}
