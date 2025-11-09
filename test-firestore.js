// Test Firestore connection
require('dotenv').config();
const { db, testConnection } = require('./src/config/database');

async function test() {
  try {
    console.log('Testing Firestore connection...\n');
    
    // Test connection (this will also test write)
    await testConnection();
    
    // Test read
    console.log('Testing read operation...');
    const testRef = db.collection('_test').doc('read-test');
    await testRef.set({
      timestamp: new Date().toISOString(),
      message: 'Read test'
    });
    
    const doc = await testRef.get();
    if (doc.exists) {
      console.log('✓ Read test successful');
      console.log('Data:', doc.data());
    }
    
    // Cleanup
    await testRef.delete();
    console.log('✓ Cleanup successful');
    
    console.log('\n=== All tests passed! ===');
    console.log('\nFirestore is ready to use!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.error('\nTroubleshooting:');
    console.error('1. Check if Firestore Database is enabled in Firebase Console');
    console.error('2. Verify service account has proper permissions');
    console.error('3. Check Firestore security rules');
    process.exit(1);
  }
}

test();

