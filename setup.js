// One-click setup script
const fs = require('fs');
const { execSync } = require('child_process');
const nacl = require('tweetnacl');

console.log('\n=== INK NFS Backend Setup ===\n');

// 1. Generate Ed25519 keypair
console.log('1. Generating Ed25519 keypair...');
const keypair = nacl.sign.keyPair();
const privateKey = Buffer.from(keypair.secretKey).toString('hex');
const publicKey = Buffer.from(keypair.publicKey).toString('hex');

// 2. Update .env file
console.log('2. Updating .env configuration...');
let envContent = fs.readFileSync('.env', 'utf8');
envContent = envContent.replace('ED25519_PRIVATE_KEY=""', `ED25519_PRIVATE_KEY="${privateKey}"`);
envContent = envContent.replace('ED25519_PUBLIC_KEY=""', `ED25519_PUBLIC_KEY="${publicKey}"`);
fs.writeFileSync('.env', envContent);

console.log('✓ Keys saved to .env');
console.log('\nPrivate Key (first 32 chars):', privateKey.substring(0, 32) + '...');
console.log('Public Key:', publicKey);

// 3. Check Firebase configuration
console.log('\n3. Checking Firebase configuration...');
// Reload .env after updating it
delete require.cache[require.resolve('dotenv')];
const env = require('dotenv').config().parsed;

if (!env.FIREBASE_SERVICE_ACCOUNT_KEY && !env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  console.log('⚠ Warning: Firebase service account not configured');
  console.log('Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH in .env');
  console.log('Download service account key from Firebase Console:');
  console.log('  Project Settings > Service Accounts > Generate New Private Key');
}

// 4. Test Firestore connection
console.log('\n4. Testing Firestore connection...');
if (env.FIREBASE_SERVICE_ACCOUNT_KEY || env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    execSync('node test-firestore.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠ Firestore connection test failed');
    console.log('Make sure Firebase service account is configured correctly');
    console.log('See FIREBASE_SETUP.md for setup instructions');
  }
} else {
  console.log('⚠ Skipping Firestore test - service account not configured');
}

console.log('\n=== ✓ Setup Complete! ===\n');
console.log('Next steps:');
console.log('1. Download Firebase service account key from Firebase Console');
console.log('2. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH in .env');
console.log('3. Start server: npm run dev\n');
