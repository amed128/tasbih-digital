const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceFile = path.join(rootDir, 'capacitor.build.gradle');
const destFile = path.join(rootDir, 'android', 'app', 'capacitor.build.gradle');

// Step 1: Run capacitor sync
execSync('npx cap sync android', { stdio: 'inherit' });

// Step 2: Overwrite the gradle file
fs.copyFileSync(sourceFile, destFile);

// Step 3: Run the app
execSync('npx cap run android', { stdio: 'inherit' });
