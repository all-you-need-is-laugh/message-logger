module.exports = {
  env: {
    jest: true,
    node: true
  },
  extends: ['plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import', 'spellcheck'],
  root: true,
  rules: {
    'array-bracket-newline': ['warn', { 'minItems': 4, 'multiline': true }],
    'array-bracket-spacing': ['warn', 'always'],
    'array-element-newline': ['warn', { 'minItems': 4, 'multiline': true }],
    'arrow-spacing': 'warn',
    'computed-property-spacing': ['error', 'never'],
    'eol-last': ['warn', 'always'],
    // TODO: review ESLint rule
    '@typescript-eslint/explicit-function-return-type': 'off',
    // TODO: review ESLint rule
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/named': 'error',
    'import/no-unresolved': 'error',
    'indent': 'off',
    '@typescript-eslint/indent': ['error', 2, { ignoredNodes: ['TemplateLiteral', 'SwitchStatement'] }],
    // TODO: review ESLint rule
    '@typescript-eslint/interface-name-prefix': 'off',
    'key-spacing': 'warn',
    'keyword-spacing': 'warn',
    'max-len': ['warn', { 'code': 120 }],
    // TODO: review ESLint rule
    '@typescript-eslint/no-explicit-any': 'off',
    'no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 1}],
    'no-restricted-imports': 'off',
    'no-undef': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 'varsIgnorePattern': '_.*' }],
    'object-curly-spacing': ['warn', 'always'],
    'object-property-newline': ['warn', { allowAllPropertiesOnSameLine: true} ],
    'quotes': ['warn', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'sort-keys': ['error', 'asc', { 'caseSensitive': true, 'minKeys': 6, 'natural': true }],
    'space-before-blocks': 'warn',
    'space-before-function-paren': ['warn', 'always'],
    'space-in-parens': ['warn', 'never'],
    'space-infix-ops': ['error', { 'int32Hint': false }],
    'spellcheck/spell-checker': [1, {
      'comments': true,
      'identifiers': true,
      'lang': 'en_US',
      'minLength': 3,
      'skipIfMatch': [
        // Ignore URLs as values
        /^https\S+$/,
      ],
      'skipWordIfMatch': [
        // Ignore words, containing non-latin symbols, like: it’s
        /\b\w*[^\w\s]+\w*\b/,
      ],
      'skipWords': [
        'dto',
        'localhost',
        'redis',
        'zadd',
        'zrange'
      ],
      'strings': true,
      'templates': true
    }],
    'template-curly-spacing': 'off'
  },
  settings: {
    'import/parsers': { '@typescript-eslint/parser': [ '.ts' ] },
    'import/resolver': { 'typescript': { 'alwaysTryTypes': true, } }
  }
};
