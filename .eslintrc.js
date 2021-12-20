const { readFileSync } = require('fs'); // don't use the node: protocol yet, as vscode still runs node 14

const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'));

const overrides = [
	// lit
	'connectedCallback',
	'disconnectedCallback',
	'attributeChangedCallback',
	'adoptedCallback',
	'hasChanged',
	'shouldUpdate',
	'willUpdate',
	'update',
	'render',
	'firstUpdated',
	'updated',
	'performUpdate',
	'getUpdateComplete',

	// vscode
	'openCustomDocument',
	'resolveCustomEditor',
	'dispose',
];

module.exports = {
	env: {
		es2020: true,
	},
	plugins: ['style'],
	rules: {
		// https://eslint.org/docs/rules/#possible-problems
		'array-callback-return': 'error',
		'for-direction': 'error',
		'no-async-promise-executor': 'error',
		'no-await-in-loop': 'error',
		'no-compare-neg-zero': 'error',
		'no-cond-assign': 'error',
		'no-constant-condition': 'error',
		'no-constructor-return': 'error',
		'no-debugger': 'error',
		'no-dupe-else-if': 'error',
		'no-duplicate-case': 'error',
		'no-empty-character-class': 'error',
		'no-empty-pattern': 'error',
		'no-ex-assign': 'error',
		'no-fallthrough': 'error',
		'no-inner-declarations': 'error',
		'no-invalid-regexp': 'error',
		'no-misleading-character-class': 'error',
		'no-prototype-builtins': 'error',
		'no-self-assign': 'error',
		'no-self-compare': 'error',
		'no-sparse-arrays': 'error',
		'no-template-curly-in-string': 'error',
		'no-unreachable': 'error',
		'no-unreachable-loop': 'error',
		'no-unsafe-finally': 'error',
		'no-unsafe-negation': ['error', { enforceForOrderingRelations: true }],
		'no-useless-backreference': 'error',
		'require-atomic-updates': 'error',
		'use-isnan': 'error',

		// https://eslint.org/docs/rules/#suggestions
		'default-case-last': 'error',
		'eqeqeq': 'error',
		'grouped-accessor-pairs': ['error', 'getBeforeSet'],
		'no-alert': 'error',
		'no-case-declarations': 'error',
		'no-console': ['error', { allow: ['warn', 'error'] }],
		'no-delete-var': 'error',
		'no-else-return': ['error', { allowElseIf: false }],
		'no-empty': ['error', { allowEmptyCatch: true }],
		'no-eval': 'error',
		'no-extend-native': 'error',
		'no-extra-boolean-cast': ['error', { enforceForLogicalOperands: true }],
		'no-implicit-coercion': 'error',
		'no-labels': 'error',
		'no-lone-blocks': 'error',
		'no-lonely-if': 'error',
		'no-multi-assign': 'error',
		'no-multi-str': 'error',
		'no-negated-condition': 'error',
		'no-new-func': 'error',
		'no-new-object': 'error',
		'no-new-wrappers': 'error',
		'no-nonoctal-decimal-escape': 'error',
		'no-octal': 'error',
		'no-octal-escape': 'error',
		'no-proto': 'error',
		'no-regex-spaces': 'error',
		'no-return-assign': ['error', 'always'],
		'no-script-url': 'error',
		'no-sequences': ['error', { allowInParentheses: false }],
		'no-shadow-restricted-names': 'error',
		'no-undef-init': 'error',
		'no-unneeded-ternary': ['error', { defaultAssignment: false }],
		'no-useless-call': 'error',
		'no-useless-catch': 'error',
		'no-useless-computed-key': ['error', { enforceForClassMembers: true }],
		'no-useless-concat': 'error',
		'no-useless-escape': 'error',
		'no-useless-return': 'error',
		'no-var': 'error',
		'no-void': 'error',
		'no-warning-comments': ['error', { location: 'anywhere' }],
		'operator-assignment': 'error',
		'prefer-arrow-callback': 'error',
		'prefer-const': 'error',
		'prefer-destructuring': 'error',
		'prefer-exponentiation-operator': 'error',
		'prefer-named-capture-group': 'error',
		'prefer-numeric-literals': 'error',
		'prefer-object-spread': 'error',
		'prefer-promise-reject-errors': 'error',
		'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'prefer-template': 'error',
		'require-unicode-regexp': 'error',
		'require-yield': 'error',
		'symbol-description': 'error',
		'yoda': 'error',

		// https://github.com/tao-cumplido/eslint-plugin-style#rules
		'style/group-imports': [
			'error',
			'dotenv/config',
			{ class: 'node' },
			{ class: 'external' },
			'./style.css',
			{ class: 'relative' },
		],
		'style/sort-imports': ['error', { caseGroups: true, typesInGroup: 'top' }],
		// 'style/experimental/no-commented-code': [
		// 	'warn',
		// 	{
		// 		ignorePatterns: ['^https?://', '^prettier-'],
		// 		extendDefaultIgnorePatterns: true,
		// 	},
		// ],
	},
	overrides: [
		{
			files: ['.*rc.js', '*.js'],
			env: {
				node: true,
			},
		},
		{
			files: ['vite.config.js'],
			parserOptions: {
				sourceType: 'module',
			},
		},
		{
			files: '*.ts',
			parser: '@typescript-eslint/parser',
			parserOptions: {
				sourceType: 'module',
				project: tsConfig.references.map(({ path }) => path),
			},
			plugins: ['@typescript-eslint'],
			rules: {
				// https://github.com/typescript-eslint/typescript-eslint/tree/v4.33.0/packages/eslint-plugin#extension-rules
				'@typescript-eslint/default-param-last': 'error',
				'@typescript-eslint/init-declarations': 'error',
				'@typescript-eslint/lines-between-class-members': [
					'error',
					'always',
					{
						exceptAfterSingleLine: true,
						exceptAfterOverload: true,
					},
				],
				'@typescript-eslint/no-dupe-class-members': 'error',
				'@typescript-eslint/no-duplicate-imports': 'error',
				'@typescript-eslint/no-empty-function': ['error', { allow: ['decoratedFunctions'] }],
				'@typescript-eslint/no-invalid-this': 'error',
				'@typescript-eslint/no-loop-func': 'error',
				'@typescript-eslint/no-loss-of-precision': 'error',
				'@typescript-eslint/no-redeclare': 'error',
				'@typescript-eslint/no-shadow': 'error',
				'@typescript-eslint/no-unused-expressions': 'error',
				'@typescript-eslint/no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_', caughtErrors: 'all' }],
				'@typescript-eslint/no-use-before-define': 'error',
				'@typescript-eslint/no-useless-constructor': 'error',

				// extension rules with type information
				'@typescript-eslint/dot-notation': 'error',
				'@typescript-eslint/no-implied-eval': 'error',
				'@typescript-eslint/no-throw-literal': 'error',
				'@typescript-eslint/require-await': 'error',
				'@typescript-eslint/return-await': 'error',

				// https://github.com/typescript-eslint/typescript-eslint/tree/v4.33.0/packages/eslint-plugin#supported-rules
				'@typescript-eslint/adjacent-overload-signatures': 'error',
				'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
				'@typescript-eslint/ban-tslint-comment': 'error',
				'@typescript-eslint/ban-types': [
					'error',
					{
						types: { BigInt: { fixWith: 'bigint' } },
						extendDefaults: true,
					},
				],
				'@typescript-eslint/class-literal-property-style': ['error', 'fields'],
				'@typescript-eslint/consistent-type-assertions': [
					'error',
					{
						assertionStyle: 'as',
						objectLiteralTypeAssertions: 'allow-as-parameter',
					},
				],
				'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
				'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
				'@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
				'@typescript-eslint/explicit-module-boundary-types': ['error', { allowedNames: [...overrides] }],
				'@typescript-eslint/member-ordering': [
					'error',
					{
						default: [
							'private-static-field',
							'protected-static-field',
							'public-static-field',
							'private-static-method',
							'protected-static-method',
							'public-static-method',
							'call-signature',
							'signature',
							'protected-abstract-field',
							'public-abstract-field',
							'private-decorated-field',
							'private-instance-field',
							'protected-decorated-field',
							'protected-instance-field',
							'public-decorated-field',
							'public-instance-field',
							'field',
							'private-constructor',
							'protected-constructor',
							'public-constructor',
							'constructor',
							'protected-abstract-method',
							'public-abstract-method',
							'private-decorated-method',
							'private-instance-method',
							'protected-decorated-method',
							'protected-instance-method',
							'public-decorated-method',
							'public-instance-method',
							'method',
						],
					},
				],
				'@typescript-eslint/method-signature-style': ['error', 'property'],
				'@typescript-eslint/naming-convention': [
					'error',
					{
						selector: 'default',
						format: ['strictCamelCase'],
						leadingUnderscore: 'forbid',
						trailingUnderscore: 'forbid',
					},
					{
						selector: ['typeLike', 'enumMember'],
						format: ['StrictPascalCase'],
					},
					{
						selector: 'parameter',
						format: ['strictCamelCase'],
						leadingUnderscore: 'allow',
					},
				],
				'@typescript-eslint/no-empty-interface': 'error',
				'@typescript-eslint/no-explicit-any': 'error',
				'@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
				'@typescript-eslint/no-inferrable-types': 'error',
				'@typescript-eslint/no-invalid-void-type': ['error', { allowAsThisParameter: true }],
				'@typescript-eslint/no-misused-new': 'error',
				'@typescript-eslint/no-namespace': 'error',
				'@typescript-eslint/no-non-null-assertion': 'error',
				'@typescript-eslint/no-parameter-properties': 'error',
				'@typescript-eslint/no-require-imports': 'error',
				'@typescript-eslint/no-this-alias': 'error',
				'@typescript-eslint/no-unnecessary-type-constraint': 'error',
				'@typescript-eslint/no-var-requires': 'error',
				'@typescript-eslint/prefer-as-const': 'error',
				'@typescript-eslint/prefer-for-of': 'error',
				'@typescript-eslint/prefer-function-type': 'error',
				'@typescript-eslint/prefer-optional-chain': 'error',
				'@typescript-eslint/triple-slash-reference': 'error',

				// rules with type information
				'@typescript-eslint/await-thenable': 'error',
				'@typescript-eslint/no-base-to-string': 'error',
				'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
				'@typescript-eslint/no-floating-promises': 'error',
				'@typescript-eslint/no-for-in-array': 'error',
				'@typescript-eslint/no-meaningless-void-operator': 'error',
				'@typescript-eslint/no-misused-promises': 'error',
				'@typescript-eslint/no-unnecessary-boolean-literal-compare': [
					'error',
					{
						allowComparingNullableBooleansToTrue: false,
						allowComparingNullableBooleansToFalse: false,
					},
				],
				'@typescript-eslint/no-unnecessary-condition': 'error',
				'@typescript-eslint/no-unnecessary-type-arguments': 'error',
				'@typescript-eslint/no-unnecessary-type-assertion': 'error',
				'@typescript-eslint/no-unsafe-argument': 'error',
				'@typescript-eslint/no-unsafe-assignment': 'error',
				'@typescript-eslint/no-unsafe-call': 'error',
				'@typescript-eslint/no-unsafe-member-access': 'error',
				'@typescript-eslint/no-unsafe-return': 'error',
				'@typescript-eslint/prefer-includes': 'error',
				'@typescript-eslint/prefer-nullish-coalescing': 'error',
				'@typescript-eslint/prefer-readonly': 'error',
				'@typescript-eslint/prefer-reduce-type-parameter': 'error',
				'@typescript-eslint/prefer-regexp-exec': 'error',
				'@typescript-eslint/prefer-return-this-type': 'error',
				'@typescript-eslint/prefer-string-starts-ends-with': 'error',
				'@typescript-eslint/promise-function-async': 'error',
				'@typescript-eslint/require-array-sort-compare': 'error',
				'@typescript-eslint/restrict-plus-operands': ['error', { checkCompoundAssignments: true }],
				'@typescript-eslint/restrict-template-expressions': 'error',
				'@typescript-eslint/switch-exhaustiveness-check': 'error',
			},
		},
	],
};
