const eslintConfig = {
	root: true,
	extends: [
		'eslint:recommended',
		'eslint-config-airbnb-base',
	],
	parser: '@babel/eslint-parser',
	rules: {
		indent: [1, 'tab'],
		allowIndentationTabs: 0,
		'no-tabs': 0,
		'object-curly-newline': 0,
		'no-unused-vars': 0,
		'no-shadow': 0,
		'no-param-reassign': 0,
		'no-bitwise': 0,
		'no-plusplus': 0,
		'max-len': ['warn', 130],
		'consistent-return': 'warn',
	},
	env: {
		browser: true,
		node: true,
	},
};

module.exports = eslintConfig;
