module.exports = {
  root: true,
  extends: ['@react-native-community', 'prettier'],
  plugins: ['react', 'react-native'],
  rules: {
    // Inline styles are common in this codebase; disable the rule to reduce noise.
    'react-native/no-inline-styles': 'off',
    // Allow component creation in props where the app uses inline headerTitle components
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
  },
};
