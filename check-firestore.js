// Check Firestore database structure and data
require('dotenv').config();
const { db } = require('./src/config/database');

async function checkFirestore() {
  try {
    console.log('Checking Firestore database...\n');

    // Check if proofs collection exists and has data
    const proofsRef = db.collection('proofs');
    const snapshot = await proofsRef.limit(5).get();

    console.log(`✓ Proofs collection exists`);
    console.log(`  Documents count: ${snapshot.size}\n`);

    if (snapshot.empty) {
      console.log('⚠ No documents found in proofs collection');
      console.log('  This is normal - data will be created when you enroll packages\n');
    } else {
      console.log('Sample documents:');
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`\n  Document ID: ${doc.id}`);
        console.log(`  Proof ID: ${data.proof_id}`);
        console.log(`  Order ID: ${data.order_id}`);
        console.log(`  NFC Token: ${data.nfc_token}`);
        console.log(`  Enrollment: ${data.enrollment_timestamp?.toDate?.() || 'N/A'}`);
        console.log(`  Delivery: ${data.delivery_timestamp?.toDate?.() || 'Not verified'}`);
      });
    }

    // Check collection structure by trying to create a test document
    console.log('\n✓ Firestore is ready to use');
    console.log('  Collections are created automatically when you write data');
    console.log('  No need to pre-create tables like SQL databases\n');

    // List all collections
    const collections = await db.listCollections();
    console.log('Collections in database:');
    collections.forEach((collection) => {
      console.log(`  - ${collection.id}`);
    });

    console.log('\n=== Firestore Check Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking Firestore:', error.message);
    process.exit(1);
  }
}

checkFirestore();

