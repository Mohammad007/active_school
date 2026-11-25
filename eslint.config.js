// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      /* Data hooks keep the latest fetcher in a ref (assigned during render) and
       * screens use apostrophes in JSX text; both are intentional. */
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/create-components-during-render': 'off',
      'react/no-unescaped-entities': 'off',
      'import/no-duplicates': 'warn',
    },
    ignores: ['dist/*'],
  },
]);
