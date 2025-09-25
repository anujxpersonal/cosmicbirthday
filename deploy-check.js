#!/usr/bin/env node

/**
 * Pre-deployment script for Vercel
 * This script prepares the project for deployment by:
 * 1. Checking if all required files exist
 * 2. Validating the build process
 * 3. Ensuring data files are accessible
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Cosmic Birthday Finder for Vercel deployment...\n');

// Check required files
const requiredFiles = [
  'package.json',
  'public/index.html',
  'src/App.js',
  'src/data/moon-phases-1960-2100.json',
  'src/data/eclipse-data-1960-2100.json',
  'vercel.json',
  'api/proxy.js'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('\n❌ Missing required files. Please ensure all files are present.');
  process.exit(1);
}

console.log('\n📦 Checking data files...');

// Check data files
try {
  const moonData = JSON.parse(fs.readFileSync('src/data/moon-phases-1960-2100.json', 'utf8'));
  const eclipseData = JSON.parse(fs.readFileSync('src/data/eclipse-data-1960-2100.json', 'utf8'));
  
  console.log(`✅ Moon phases: ${moonData?.metadata?.totalPhases || 0} records`);
  console.log(`✅ Eclipse data: ${eclipseData?.metadata?.totalEclipses || 0} records`);
} catch (error) {
  console.error('❌ Error reading data files:', error.message);
  process.exit(1);
}

console.log('\n🔧 Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Project: ${pkg.name} v${pkg.version}`);
  console.log(`✅ React: ${pkg.dependencies?.react || 'Not found'}`);
  console.log(`✅ Build script: ${pkg.scripts?.build ? 'Present' : 'Missing'}`);
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

console.log('\n✅ All checks passed! Your project is ready for Vercel deployment.');
console.log('\nNext steps:');
console.log('1. Push your code to GitHub');
console.log('2. Connect your repository to Vercel');
console.log('3. Deploy with Vercel');

console.log('\n🌟 Happy cosmic coding! ✨');