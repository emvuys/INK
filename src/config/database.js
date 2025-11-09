const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Option 1: Use service account key as JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Option 2: Use service account file path
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Resolve path relative to project root
      const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Firebase service account file not found: ${serviceAccountPath}`);
      }
      
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Option 3: Use default credentials (for Google Cloud environment)
    else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
    console.log('✓ Firebase Admin initialized');
  } catch (error) {
    console.error('✗ Firebase initialization failed:', error.message);
    console.error('Make sure FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_KEY is set correctly');
    process.exit(1);
  }
}

const db = admin.firestore();

// Test Firestore connection
async function testConnection() {
  try {
    // Try to write a test document to verify Firestore is accessible
    const testRef = db.collection('_health').doc('test');
    await testRef.set({
      timestamp: new Date().toISOString(),
      message: 'Connection test'
    });
    console.log('✓ Firestore connected and writable');
    
    // Clean up test document
    await testRef.delete();
    return true;
  } catch (error) {
    // Check error code
    if (error.code === 5) {
      // NOT_FOUND - Firestore might not be enabled or project doesn't exist
      console.error('✗ Firestore database not found');
      console.error('Please ensure:');
      console.error('1. Firestore Database is enabled in Firebase Console');
      console.error('2. You are using the correct Firebase project');
      console.error('3. Service account has Firestore permissions');
      throw error;
    } else if (error.code === 7) {
      // PERMISSION_DENIED - Security rules or permissions issue
      console.error('✗ Firestore permission denied');
      console.error('Please check Firestore security rules and service account permissions');
      throw error;
    } else {
      console.error('✗ Firestore connection failed:', error.message);
      console.error('Error code:', error.code);
      throw error;
    }
  }
}

module.exports = { db, testConnection };
