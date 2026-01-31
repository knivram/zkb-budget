const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// TODO: Workaround – stub out native-only modules on web so `expo export --platform web`
// (used only for API routes) doesn't crash on requireNativeViewManager.
// Remove once Expo supports exporting only API routes without bundling screen routes.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@expo/ui/swift-ui') {
    return {
      filePath: path.resolve(__dirname, 'lib/stubs/expo-ui-swift-ui.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
