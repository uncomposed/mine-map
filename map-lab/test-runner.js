#!/usr/bin/env node

/**
 * Test Runner for Map Lab
 * Tests zoom/pan functionality and terrain generation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Map Lab Test Runner');
console.log('======================\n');

// Check if tests directory exists
const testsDir = path.join(__dirname, 'tests');
if (!fs.existsSync(testsDir)) {
  console.log('❌ Tests directory not found. Creating...');
  fs.mkdirSync(testsDir, { recursive: true });
}

// Check if test files exist
const testFiles = [
  'tests/zoom-pan.spec.ts',
  'tests/terrain-generation.spec.ts'
];

let missingTests = false;
testFiles.forEach(file => {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.log(`❌ Test file missing: ${file}`);
    missingTests = true;
  }
});

if (missingTests) {
  console.log('\n⚠️  Some test files are missing. Please ensure all tests are created.');
  process.exit(1);
}

console.log('✅ All test files found');

// Run the tests
console.log('\n🚀 Running tests...\n');

try {
  // Run zoom/pan tests
  console.log('Testing Zoom and Pan Functionality...');
  execSync('npm test -- tests/zoom-pan.spec.ts', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('\n✅ Zoom and Pan tests passed!\n');
  
  // Run terrain generation tests
  console.log('Testing Terrain Generation...');
  execSync('npm test -- tests/terrain-generation.spec.ts', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('\n✅ Terrain Generation tests passed!\n');
  
  console.log('🎉 All tests passed! Your map should now:');
  console.log('   • Zoom and pan smoothly without snapping back');
  console.log('   • Generate realistic continents with oceans and lakes');
  console.log('   • Have proper terrain distribution');
  
} catch (error) {
  console.log('\n❌ Some tests failed. This indicates issues that need fixing:');
  console.log('   • Check the error messages above');
  console.log('   • Verify that all dependencies are installed');
  console.log('   • Ensure the code changes were applied correctly');
  process.exit(1);
}
