import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_|^React$' },
      ],
    },
  },
  {
    files: ['src/components/AnomalousHero.jsx', 'src/components/GlyphPortal.jsx'],
    rules: {
      // Disabled: this rule targets React Compiler codegen and false-positives on
      // idiomatic local-variable mutation this project doesn't use the Compiler for —
      // react-three-fiber's per-frame mutation (mesh.rotation, uniforms.value, etc.) in
      // AnomalousHero, and a plain accumulator loop (character offset tracking) in the
      // third-party GlyphPortal component. Scoped to just these files so the rule stays
      // active (at its recommended default) for the rest of the codebase.
      'react-hooks/immutability': 'off',
    },
  },
];
