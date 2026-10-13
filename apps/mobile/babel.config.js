// react-native-filament roda o laço de render em worklets (react-native-worklets-core).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [["react-native-worklets-core/plugin", { processNestedWorklets: true }]],
  };
};
