const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const reactRoot = path.join(monorepoRoot, 'node_modules', 'react');
const reactDomRoot = path.join(monorepoRoot, 'node_modules', 'react-dom');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

// Racine du monorepo en priorité → une seule version de React (19.1.0)
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  react: reactRoot,
  'react-dom': reactDomRoot,
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { filePath: path.join(reactRoot, 'index.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
