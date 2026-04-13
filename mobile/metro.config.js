const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for Socket.io bundling in Metro
config.resolver.sourceExts.push('mjs');

module.exports = config;
