// Generate Ed25519 key pair
const nacl = require('tweetnacl');

const keypair = nacl.sign.keyPair();

console.log('\n=== Ed25519 Key Pair ===\n');
console.log('Private Key (keep secret, save to .env):');
console.log(Buffer.from(keypair.secretKey).toString('hex'));
console.log('\nPublic Key (can be public):');
console.log(Buffer.from(keypair.publicKey).toString('hex'));
console.log('\n');

