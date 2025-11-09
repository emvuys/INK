# INK NFS Backend

Milestone 1: Core APIs & Database

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase
1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Download service account key (Project Settings > Service Accounts)
4. Save as `firebase-service-account.json` in project root
5. Add to `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"`

### 3. One-click setup
```bash
node setup.js
```

This will automatically:
- Generate Ed25519 keypair
- Test Firestore connection

### 4. Start server
```bash
npm run dev
```

## API Endpoints

- `POST /enroll` - Register package at shipment
- `POST /verify` - Verify delivery on customer tap
- `GET /retrieve/:proofId` - Retrieve proof record
- `GET /.well-known/jwks.json` - Get public key
- `GET /health` - Health check

## Database

- **Cloud Firestore** (NoSQL document database)
- See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup instructions

## Tech Stack

- Node.js + Express.js
- Firebase Admin SDK
- Cloud Firestore
- Ed25519 cryptographic signatures
- HMAC-SHA256 webhooks
