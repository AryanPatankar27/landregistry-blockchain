# TerraChain Frontend

Next.js 16 frontend for the TerraChain Land Registry. See the [root README](../README.md) for full project setup.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **Wagmi v3 + Viem** — wallet connection, contract reads/writes
- **Zustand** — global state, persisted to localStorage
- **SIWE** — Sign-In with Ethereum
- **react-hot-toast** — notifications
- **Tailwind CSS** — styling

## Pages

| Route | Description |
|---|---|
| `/` | Landing / home |
| `/dashboard` | Role-aware dashboard (citizen / registrar / admin) |
| `/land/register` | Register a new land parcel |
| `/land/search` | Search parcels by survey number, location, or wallet |
| `/land/[tokenId]` | Parcel detail page |
| `/transfer` | Initiate or accept a transfer |
| `/disputes` | Raise or resolve disputes |

## Running Locally

```bash
npm install
npm run dev
# http://localhost:3000
```

Requires `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

## Key Implementation Notes

### Unified Connect + Sign In
`Connect Wallet` does both steps in one click:
1. MetaMask account selection (wagmi `connectAsync`)
2. SIWE signature request → JWT + role stored in `localStorage`

If the signature is rejected, a **Sign In** retry button appears without needing to reconnect.

### Pre-flight Contract Validation
Before opening MetaMask for `registerLand`, the frontend calls `getTokenIdBySurvey` on-chain. If the survey number is already registered, a clear error is shown — no wasted gas.

### TokenId Resolution
After a `registerLand` tx confirms, the receipt's `LandRegistered` event logs are parsed with viem's `parseEventLogs` to extract the real `tokenId`. This fixes the previously broken `tokenId: 0` backend cache.

When the admin dashboard calls `approveLand` on a parcel with `tokenId: 0`, it auto-resolves the correct ID via `getTokenIdBySurvey` before sending the transaction.

### Session Persistence
Both `token` (JWT) and `user` object are stored in `localStorage`. On page refresh, the store hydrates from storage. Switching MetaMask accounts clears the session automatically.
