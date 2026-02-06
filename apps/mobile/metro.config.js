const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1) Watch all files within the monorepo (root, apps, packages)
config.watchFolders = Array.from(new Set([
  ...(config.watchFolders || []),
  workspaceRoot,
  path.resolve(workspaceRoot, 'apps'),
  path.resolve(workspaceRoot, 'packages'),
]));

// 2) Resolve packages first from the app, then from the root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3) Prevent Metro from climbing parent dirs (avoid hoisted copies)
config.resolver.disableHierarchicalLookup = true;

// 4) Pin native module resolution to the app's node_modules
config.resolver.extraNodeModules = {
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'expo': path.resolve(projectRoot, 'node_modules/expo'),
  '@expo': path.resolve(projectRoot, 'node_modules/@expo'),
  '@react-native': path.resolve(projectRoot, 'node_modules/@react-native'),
  'react-native-gesture-handler': path.resolve(projectRoot, 'node_modules/react-native-gesture-handler'),
  'react-native-reanimated': path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
  'react-native-screens': path.resolve(projectRoot, 'node_modules/react-native-screens'),
  'react-native-safe-area-context': path.resolve(projectRoot, 'node_modules/react-native-safe-area-context'),
  'react-native-maps': path.resolve(projectRoot, 'node_modules/react-native-maps'),
};

module.exports = config;
