const eslintConfig = {
  root: true,
  extends: [
    'eslint:recommended',
    'eslint-config-airbnb-base',
  ],
  parser: '@babel/eslint-parser',
  rules: {
    allowIndentationTabs: 0,
    'object-curly-newline': 0,
    'no-param-reassign': 0,
    'max-len': ['warn', 130],
    'consistent-return': 'warn',
  },
  env: {
    browser: true,
    node: true,
  },
};

module.exports = eslintConfig;
