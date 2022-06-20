const fs = require('fs');
const path = require('path');

const prettierOptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, '.prettierrc'), 'utf8'));

module.exports = {
  extends: ['react-app', 'prettier', 'prettier/react'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', prettierOptions],

    // import rules
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-deprecated': 'error',
    'import/no-duplicates': 'error',
    'import/no-namespace': 'off',
    'import/no-self-import': 'error',
    'import/no-unresolved': 'off',
    'import/no-useless-path-segments': 'error',

    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [
          {
            pattern: '{app,assets,hooks,locales,store,styles,types,utils,demo,constants,bnJs,queries}{**,**/**}',
            group: 'internal',
          },
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: [],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      rules: { 'prettier/prettier': ['warn', prettierOptions] },
    },
  ],
  ignorePatterns: ['**/hw-app-icx/**/*.js', '**/charting_library/**/**'],
};
