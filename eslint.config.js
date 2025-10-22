import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  jsonc: true,
  markdown: true,
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  rules: {
    // 代码质量规则
    'no-console': ['warn', { allow: ['warn', 'error'] }], // 建议使用logger
    'no-debugger': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'no-unused-vars': 'off', // 使用TS的未使用变量检查
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // 代码风格规则
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // 最佳实践
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // Node.js 规则
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off'
  },
  ignores: [
    'dist',
    'node_modules',
    '.ldesign-cache',
    'data',
    '*.min.js',
    'coverage',
    'src/web/dist'
  ]
})
