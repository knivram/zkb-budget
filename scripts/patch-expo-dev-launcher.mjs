import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// TODO #78: Remove this entire script once Expo ships the final SDK release
// that includes the upstream dev-launcher fix from expo/expo#42873.

const projectRoot = process.cwd();

const controllerPath = join(
  projectRoot,
  'node_modules/expo-dev-launcher/ios/EXDevLauncherController.m'
);
const manifestParserPath = join(
  projectRoot,
  'node_modules/expo-dev-launcher/ios/Manifest/EXDevLauncherManifestParser.m'
);

if (!existsSync(controllerPath) || !existsSync(manifestParserPath)) {
  console.log('[patch-expo-dev-launcher] expo-dev-launcher iOS sources not found, skipping.');
  process.exit(0);
}

const oldCurrentWindowBlock = `- (EXDevLauncherErrorManager *)errorManage
{
  return _errorManager;
}`;

// TODO #78: Remove this currentWindow patch after the final Expo SDK includes it.
const newCurrentWindowBlock = `- (UIWindow *)currentWindow
{
#if !TARGET_OS_OSX
  for (UIWindow *window in UIApplication.sharedApplication.windows) {
    if (window.isKeyWindow) {
      return window;
    }
  }
  return nil;
#else
  return NSApplication.sharedApplication.keyWindow;
#endif
}`;

const oldManifestErrorBlock = `if (error) {
      onError(error);
      return;
    }
    completionHandler(data, response);`;

// TODO #78: Remove this manifest callback guard patch after upgrading to final SDK.
const newManifestErrorBlock = `if (!error) {
      completionHandler(data, response);
    } else if (onError) {
      onError(error);
    }`;

let changed = false;

const patchController = () => {
  const source = readFileSync(controllerPath, 'utf8');

  if (source.includes(newCurrentWindowBlock)) {
    return;
  }
  if (!source.includes(oldCurrentWindowBlock)) {
    throw new Error(
      'Could not find EXDevLauncherController errorManage block to patch. The upstream source layout changed.'
    );
  }

  const updated = source.replace(oldCurrentWindowBlock, newCurrentWindowBlock);
  writeFileSync(controllerPath, updated);
  changed = true;
};

const patchManifestParser = () => {
  const source = readFileSync(manifestParserPath, 'utf8');

  if (source.includes(newManifestErrorBlock)) {
    return;
  }
  if (!source.includes(oldManifestErrorBlock)) {
    throw new Error(
      'Could not find EXDevLauncherManifestParser error callback block to patch. The upstream source layout changed.'
    );
  }

  const updated = source.replace(oldManifestErrorBlock, newManifestErrorBlock);
  writeFileSync(manifestParserPath, updated);
  changed = true;
};

patchController();
patchManifestParser();

if (changed) {
  console.log('[patch-expo-dev-launcher] Applied iOS dev-launcher crash fix.');
} else {
  console.log('[patch-expo-dev-launcher] Already patched.');
}
