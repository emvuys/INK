# Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: One-Click Setup

```bash
node setup.js
```

This script will automatically:
- ✓ Generate Ed25519 keypair
- ✓ Update .env configuration
- ✓ Test database connection
- ✓ Create database tables

## Step 3: Start Server

```bash
npm run dev
```

Server will run on: http://localhost:8000

## Test APIs

Health check:
```bash
curl http://localhost:8000/health
```

View public key:
```bash
curl http://localhost:8000/.well-known/jwks.json
```

## Database Management

Open visual interface:
```bash
npm run db:studio
```

## Manual Steps (if auto-setup fails)

### 1. Generate keys
```bash
node scripts/generate-keys.js
```
Copy output keys to .env file

### 2. Test connection
```bash
node test-db-connection.js
```

### 3. Database migration
```bash
npx prisma migrate dev --name init
```

### 4. Start server
```bash
npm run dev
```

## Troubleshooting

### Database connection failed
- Check if port 5432 is open on cloud server firewall
- Check if PostgreSQL pg_hba.conf allows remote connections
- Verify database username and password

### Prisma migration fails
Try manual SQL execution:
```bash
psql "postgresql://inknfs:37zHaAKAhAGxwXJA@193.57.137.90:5432/inknfs"
```

## Next Steps

1. Test all API endpoints
2. Integrate webhook with Taimoor
3. Deploy to production

