/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceFile = path.join(rootDir, 'capacitor.build.gradle');
const destFile = path.join(rootDir, 'android', 'app', 'capacitor.build.gradle');

fs.copyFileSync(sourceFile, destFile);
