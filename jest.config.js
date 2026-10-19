module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-native-async-storage|react-native-video|react-native-safe-area-context|react-native-svg)/)',
  ],
  moduleNameMapper: {
    '\\.(mp4|mp3|png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
