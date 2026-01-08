# Monkeytype Local Setup Guide

## Prerequisites

- **Node.js 24.11.0** (or 22.21.0) - Install from https://nodejs.org/ or use nvm
- **PNPM 9.6.0** - Run: `npm install -g pnpm@9.6.0`
- **Docker Desktop** - Install from https://www.docker.com/get-started/
- **Git** - Install from https://git-scm.com/

## Setup Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/monkeytypegame/monkeytype.git
cd monkeytype
```

### Step 2: Install Dependencies

```bash
pnpm install
```

_Note: If you get Node version errors, create `.npmrc` files with `engine-strict=false` in root, backend, and frontend directories._

### Step 3: Configure Backend

```bash
# Copy environment file
copy backend\example.env backend\.env

# The .env file already has MODE=dev set, which is what you need
```

### Step 4: Create Firebase Config (Optional)

Create `frontend/src/ts/constants/firebase-config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
```

_Leave empty for development without authentication features._

### Step 5: Start Databases

```bash
cd backend
npm run docker-db-only
```

_This starts MongoDB (port 27017) and Redis (port 6379) in Docker containers._

### Step 6: Start Backend Server

Open a new terminal:

```bash
cd backend
npm run dev
```

_Backend will run on http://localhost:5005_

### Step 7: Start Frontend

Open another new terminal:

```bash
npm run dev-fe
```

_Frontend will run on http://localhost:3000_

### Step 8: Open Application

Visit **http://localhost:3000** in your browser!

## Quick Start Commands

After initial setup, you only need:

1. `cd backend && npm run docker-db-only` (start databases)
2. `cd backend && npm run dev` (start backend)
3. `npm run dev-fe` (start frontend)

## Troubleshooting

**Node version error?**

- Use `nvm use 24.11.0` or create `.npmrc` files with `engine-strict=false`

**Backend won't connect to database?**

- Ensure Docker Desktop is running
- Check databases are running: `docker ps`

**Firebase error on frontend?**

- This is normal if you haven't set up Firebase
- You can still use all typing features without authentication

**Port already in use?**

- Stop other processes using ports 3000, 5005, 27017, or 6379
