# TerraChain — Decentralized Land Registry

TerraChain is a blockchain-powered land registry system that eliminates fraud, reduces bureaucracy, and provides immutable ownership of real estate. Every land parcel is an ERC-721 NFT on the Ethereum Sepolia testnet.

Built with **Next.js 16**, **Node.js / Express**, **Prisma**, and **Solidity 0.8.20**, using **Wagmi v3 + Viem** for on-chain interaction and **SIWE (Sign-In with Ethereum)** for wallet authentication.

---

## Features

- **ERC-721 NFT Land Parcels** — every approved parcel is minted as a unique NFT
- **Role-Based Access Control** — on-chain `ADMIN_ROLE` and `REGISTRAR_ROLE` via OpenZeppelin AccessControl; roles auto-synced from chain on every login
- **Three-step Transfers** — Initiate → Accept (buyer) → Approve (registrar), preventing double-selling fraud
- **Dispute Freezing** — any citizen can freeze a parcel by raising a dispute with IPFS evidence; registrars resolve it
- **Immutable Ownership History** — full chain of custody stored on-chain
- **Off-Chain Cache** — Express + Prisma/SQLite indexes events for fast dashboard queries
- **SIWE Authentication** — wallet-native sign-in; JWT issued with on-chain role
- **Pre-flight Validation** — frontend checks the contract before opening MetaMask to prevent "likely to fail" warnings

---

## Architecture

```
blockchain-major-project/
├── contracts/              # Hardhat project
│   ├── contracts/
│   │   └── LandRegistry.sol
│   └── scripts/
│       └── deploy.ts       # Auto-updates .env files on deploy
│
├── backend/                # Express 5 + Prisma off-chain cache
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts      # SIWE + on-chain role sync
│   │   │   ├── land.routes.ts      # Land CRUD + OR-logic search
│   │   │   ├── dashboard.routes.ts # Owner / Registrar / Admin views
│   │   │   ├── transfer.routes.ts
│   │   │   └── dispute.routes.ts
│   │   └── middleware/
│   │       └── auth.middleware.ts
│   └── prisma/schema.prisma
│
└── frontend/               # Next.js 16 App Router
    └── src/
        ├── app/
        │   ├── dashboard/page.tsx   # Role-aware dashboard
        │   ├── land/
        │   │   ├── register/page.tsx
        │   │   ├── search/page.tsx
        │   │   └── [tokenId]/page.tsx
        │   ├── transfer/page.tsx
        │   └── disputes/page.tsx
        ├── components/
        │   └── Navbar.tsx           # Unified connect+sign-in flow
        └── lib/
            ├── wagmi.ts
            ├── store.ts             # Zustand (persisted to localStorage)
            ├── api.ts
            └── contracts/
                └── LandRegistryABI.ts
```

---

## Smart Contract

### Roles

| Role | Who | Permissions |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer | Full admin |
| `ADMIN_ROLE` | Deployer | Manage registrars, view analytics |
| `REGISTRAR_ROLE` | Deployer + assigned | Approve/reject registrations & transfers, resolve disputes |

### Key Functions

| Function | Caller | Description |
|---|---|---|
| `registerLand(surveyNumber, location, area, documentsCID)` | Anyone | Submit parcel (status: Pending) |
| `approveLand(tokenId)` | Registrar | Mint NFT to owner |
| `rejectLand(tokenId, reason)` | Registrar | Reject pending registration |
| `initiateTransfer(tokenId, buyer)` | Owner | Start transfer |
| `acceptTransfer(tokenId)` | Buyer | Accept transfer |
| `approveTransfer(tokenId)` | Registrar | Complete NFT transfer |
| `raiseDispute(tokenId, evidenceCID)` | Anyone | Freeze parcel |
| `resolveDispute(tokenId, upheld)` | Registrar | Clear or uphold dispute |
| `addRegistrar(address)` | Admin | Grant REGISTRAR_ROLE |
| `hasRole(role, account)` | View | Check on-chain role |

### Parcel Status Flow

```
          registerLand()
               │
           [PENDING]
          /           \
  approveLand()    rejectLand()
       │
   [APPROVED] ──raiseDispute()──► [UNDER_DISPUTE]
       ▲                                │
       └──────resolveDispute(false)─────┘
                                        │
                         resolveDispute(true) → stays frozen
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Sepolia ETH (from a faucet like [sepoliafaucet.com](https://sepoliafaucet.com))

### 1. Install Dependencies

```bash
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

**`contracts/.env`**
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_deployer_wallet_private_key
```

**`backend/.env`**
```env
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:3000
# These are filled automatically by the deploy script:
CONTRACT_ADDRESS=
RPC_URL=
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CHAIN_ID=11155111
# These are filled automatically by the deploy script:
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=
```

### 3. Deploy the Contract

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

The deploy script automatically updates `backend/.env` and `frontend/.env.local` with `CONTRACT_ADDRESS` and `RPC_URL`.

### 4. Start the Backend

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run dev
# Running on http://localhost:5000
```

### 5. Start the Frontend

```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

---

## Using the App

### Connect & Sign In

Clicking **Connect Wallet** triggers a two-step flow automatically:
1. MetaMask opens for **account selection**
2. MetaMask immediately prompts for a **SIWE signature**
3. Backend verifies the signature, checks on-chain roles, and issues a JWT
4. If Account 1 (deployer) signs in, their role is auto-detected as `ADMIN` from the contract

If you accidentally reject the signature, a **Sign In** retry button appears next to your address without needing to reconnect.

Switching accounts in MetaMask automatically clears the previous session.

### Registering Land (Account 2 / Citizen)

1. Connect with Account 2 and sign in
2. Go to **Register Land**
3. Fill in survey number, location, area (integer sq. meters), and an IPFS CID for documents
4. Submit — the frontend first validates on-chain that the survey number isn't taken
5. After MetaMask confirms the transaction, the real `tokenId` is parsed from the `LandRegistered` event and stored in the backend

### Approving Land (Account 1 / Admin)

1. Connect with Account 1 and sign in (role shows as `ADMIN`)
2. Go to **Dashboard** — pending registrations appear in a table
3. Click **Approve** — if `tokenId` is `0` in the DB (cached before receipt), the dashboard auto-resolves the real ID via `getTokenIdBySurvey` on-chain
4. MetaMask opens for `approveLand` — the NFT is minted to the citizen

### Search

Search by survey number, location, or wallet address from the **Search** page. Uses OR logic — one query matches across all fields.

---

## Authentication & Role Sync

Every SIWE login triggers an on-chain role check via `hasRole`:
- If the wallet has `ADMIN_ROLE` on-chain → DB role set to `ADMIN`
- If the wallet has `REGISTRAR_ROLE` on-chain → DB role set to `REGISTRAR`
- Otherwise → role remains `OWNER`

User session (JWT + user object) is persisted to `localStorage` and restored on page refresh. Stale sessions (mismatched address) are cleared automatically.

---

## Gas Limits

Explicit gas limits prevent MetaMask simulation failures on Sepolia:

| Function | Gas |
|---|---|
| `registerLand` | 350,000 |
| `approveLand` | 250,000 |
| `approveTransfer` | 200,000 |
| `initiateTransfer` | 150,000 |
| `raiseDispute` | 150,000 |
| `acceptTransfer` | 100,000 |
| `resolveDispute` | 100,000 |
| `rejectLand` | 80,000 |

---

## API Reference

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/nonce` | — | Get SIWE nonce |
| POST | `/verify` | — | Verify signature, issue JWT, sync on-chain role |
| GET | `/me` | JWT | Current user profile |
| PATCH | `/role/:wallet` | Admin JWT | Update user role |

### Land (`/api/land`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | JWT | Cache a new registration |
| GET | `/` | — | Search (`?query=`, `?status=`) |
| GET | `/:tokenId` | — | Get parcel by tokenId |
| PATCH | `/:tokenId/status` | JWT | Update status / correct tokenId |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/owner` | JWT | My parcels + recent transfers |
| GET | `/registrar` | Registrar JWT | Pending items + stats |
| GET | `/admin` | Admin JWT | Platform-wide analytics |

### Transfers (`/api/transfer`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Cache transfer initiation |

### Disputes (`/api/disputes`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Cache a raised dispute |
| GET | `/pending` | Registrar JWT | List unresolved disputes |

---

## License

MIT
