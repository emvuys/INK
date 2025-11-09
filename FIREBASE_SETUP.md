# Firebase Firestore Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `ink-nfs` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Enable Firestore Database

1. In Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll set up security rules later)
4. Select a location (choose closest to your users)
5. Enable Firestore

## Step 3: Create Service Account

1. Go to "Project Settings" (gear icon)
2. Click "Service Accounts" tab
3. Click "Generate New Private Key"
4. Save the JSON file as `firebase-service-account.json` in project root
5. **Important**: Add `firebase-service-account.json` to `.gitignore` (never commit this file!)

## Step 4: Configure Environment Variables

### Option 1: Use Service Account File (Local Development)

In `.env` file:
```env
FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-service-account.json"
```

### Option 2: Use JSON String (Deployment)

Convert service account JSON to a single line string and set:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

## Step 5: Set Up Firestore Security Rules

Go to Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated requests only
    // For production, implement proper authentication
    match /proofs/{proofId} {
      allow read: if true; // Public read for dispute page
      allow write: if false; // Only server can write (via Admin SDK)
    }
  }
}
```

## Step 6: Create Firestore Indexes

Firestore requires composite indexes for queries. Create these indexes:

### Index 1: nfc_token query
- Collection: `proofs`
- Fields: `nfc_token` (Ascending)
- Query scope: Collection

### Index 2: order_id query (if needed)
- Collection: `proofs`
- Fields: `order_id` (Ascending)
- Query scope: Collection

**Note**: Firestore will automatically prompt you to create indexes when you first run queries. Click the link in the error message to create them.

## Step 7: Test Connection

```bash
node -e "require('./src/config/database').testConnection()"
```

## Troubleshooting

### Error: "Permission denied"
- Check Firebase service account key is correct
- Verify service account has "Firebase Admin SDK Administrator Service Agent" role

### Error: "Collection group query requires index"
- Click the error link to create the index in Firebase Console
- Or manually create indexes in Firestore > Indexes

### Error: "Missing or insufficient permissions"
- Check Firestore security rules
- Make sure service account has proper permissions

## Firestore Data Structure

```
proofs (collection)
  └── {proofId} (document)
      ├── proof_id: string
      ├── order_id: string
      ├── nfc_uid: string
      ├── nfc_token: string
      ├── enrollment_timestamp: timestamp
      ├── shipping_address_gps: object
      ├── warehouse_gps: object
      ├── photo_urls: array
      ├── photo_hashes: array
      ├── customer_phone_last4: string
      ├── delivery_timestamp: timestamp (nullable)
      ├── delivery_gps: object (nullable)
      ├── device_info: string (nullable)
      ├── gps_verdict: string (nullable)
      ├── phone_verified: boolean
      ├── signature: string
      ├── key_id: string
      ├── created_at: timestamp
      └── updated_at: timestamp
```

