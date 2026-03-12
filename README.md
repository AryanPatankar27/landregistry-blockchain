# TerraChain — Decentralized Land Registry

TerraChain is a next-generation, blockchain-powered land registry system designed to eliminate fraud, reduce bureaucracy, and provide true, immutable ownership of real estate.

Built with **Next.js 14**, **Node.js/Express**, and **Solidity (Polygon/Ethereum)**, TerraChain replaces paper-based registries with transparent, on-chain records utilizing ERC-721 NFTs.

## 🌟 Key Features

*   **Immutable Records:** Every land parcel is minted as a unique ERC-721 NFT (Non-Fungible Token) on the blockchain. Once registered and approved, it cannot be tampered with.
*   **Role-Based Access Control:** Strict Separation of Duties. Normal citizens can register and transfer land, but only government **Registrars** can approve registrations or finalize transfers.
*   **Instant & Secure Transfers:** Transfer land ownership securely through a cryptographic three-step process (Initiate -> Accept -> Approve), eliminating double-selling fraud.
*   **Dispute Management:** Integrated dispute flagging. If an issue arises, any citizen can submit IPFS evidence to flag a parcel. Disputed parcels are instantly "frozen," blocking any transfers until a Registrar resolves the issue.
*   **Transparent Ownership History:** A permanent, publicly verifiable timeline of past ownership is kept cryptographically secure on the blockchain.
*   **Off-Chain Cache:** A high-performance Node.js/PostgreSQL (SQLite for local dev) backend indexes the blockchain to provide lightning-fast searches and dashboard aggregation without relying entirely on slow RPC calls.

---

## 🏗️ Architecture

The project is split into three distinct micro-services:

1.  **`/contracts` (Hardhat / Solidity):**
    *   The core `LandRegistry.sol` smart contract written in Solidity `0.8.28`.
    *   Utilizes OpenZeppelin libraries for secure `ERC721`, `AccessControl`, and `ReentrancyGuard` implementations.
    *   Deployed locally via Hardhat Node, or to Polygon Amoy Testnet.
2.  **`/backend` (Node.js / Express / Prisma):**
    *   Provides off-chain caching for lightning-fast frontend dashboard loading.
    *   Utilizes SIWE (Sign-In with Ethereum) for secure wallet-based authentication, issuing off-chain JWTs.
    *   Synchronizes and indexes on-chain data (parcels, transfers, disputes).
3.  **`/frontend` (Next.js 14 App Router):**
    *   A highly interactive, modern web application styled with Tailwind CSS and advanced glassmorphism aesthetics.
    *   Utilizes `wagmi` and `viem` to broadcast transactions to MetaMask and the blockchain.

---

## 🚀 Local Development Setup

Follow these steps to run the entire TerraChain ecosystem locally on your machine.

### Prerequisites

*   **Node.js** (v18+)
*   **MetaMask** Browser Extension

### 1. Smart Contracts (Hardhat)

1.  Open a terminal and navigate to the contracts directory:
    ```bash
    cd contracts
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local Hardhat blockchain node:
    ```bash
    npx hardhat node
    ```
    *(Leave this terminal window open. It provides 20 test accounts with 10,000 ETH each).*
4.  Open a **new** terminal window, navigate to the contracts directory again, and deploy the smart contract to your local node:
    ```bash
    npx hardhat run scripts/deploy.ts --network localhost
    ```
5.  **Copy the Contract Address** printed in the terminal (e.g., `0x5Fb...`).

### 2. Backend (Node.js/Express)

1.  Open a new terminal and navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables:
    *   Open `backend/.env`
    *   Set the `CONTRACT_ADDRESS=` to the address you copied from the deployment step.
4.  Initialize the Prisma Database (SQLite):
    ```bash
    npx prisma migrate dev --name init
    npx prisma generate
    ```
5.  Start the backend development server:
    ```bash
    npm run dev
    ```
    *(The backend will start running on port 5000).*

### 3. Frontend (Next.js)

1.  Open a final terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables:
    *   Open `frontend/.env.local`
    *   Set the `NEXT_PUBLIC_CONTRACT_ADDRESS=` to the address you copied from the deployment step.
4.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    *(The frontend will start running on port 3000).*

---

## 🦊 Testing with MetaMask locally

1.  Open MetaMask and add the **Hardhat Localhost** network:
    *   **RPC URL:** `http://127.0.0.1:8545`
    *   **Chain ID:** `31337`
    *   **Currency Symbol:** `ETH`
2.  Import **Account #0** Private Key from your terminal running the `hardhat node`. (This account deployed the contract, so it acts as the **Registrar**).
3.  Import **Account #1** Private Key. (This account will act as the **Citizen/User**).
4.  Visit [http://localhost:3000](http://localhost:3000), connect your wallet, and start registering land!

---

## 📜 License
This project is licensed under the MIT License.
