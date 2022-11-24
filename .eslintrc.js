const eslintConfig = {
  root: true,
  extends: [
    'eslint:recommended',
    'eslint-config-airbnb-base',
  ],
  parser: '@babel/eslint-parser',
  rules: {
    indent: [1, 'tab'],
    allowIndentationTabs: true,
  },
  env: {
    browser: true,
    node: true,
  },
  exclude: ['node_modules'],
};

module.exports = eslintConfig;
