# Stellar Payment Tracker

A full-stack Web3 payment tracking application built with **Next.js 16**, **Soroban smart contracts**, and **Stellar Testnet**. Connect your Stellar wallet, queue multiple XLM payments, send them all in a single atomic transaction, and view your on-chain history — all from a clean dark UI.

---

## Features

- **Wallet connection** via [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) (Freighter, xBull, Albedo, Lobstr, and more)
- **Batch payments** — queue multiple recipients, send as a single Stellar transaction (one signature, one hash)
- **Live transaction status** — PENDING → SUCCESS / FAILED with real tx hash linking to [stellar.expert](https://stellar.expert/explorer/testnet)
- **On-chain history** — payment history stored in a Soroban smart contract, loaded on wallet connect
- **3 error types** handled: `WalletNotFoundError`, `UserRejectedError`, `InsufficientBalanceError`

---

## Deployed Smart Contract

| Network | Contract ID |
|---------|------------|
| Stellar Testnet | `CAOQVXHWVHX7TQMEBG7PXJ72PVHAIAWAYM4QJRWPM6CYVQIIB7HZA77U` |

View on Stellar Lab: [CAOQVXHWV…HZA77U](https://lab.stellar.org/r/testnet/contract/CAOQVXHWVHX7TQMEBG7PXJ72PVHAIAWAYM4QJRWPM6CYVQIIB7HZA77U)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Wallet | @creit.tech/stellar-wallets-kit v2 |
| Stellar SDK | @stellar/stellar-sdk v13 |
| Smart Contract | Soroban (Rust), soroban-sdk v22 |
| Network | Stellar Testnet (Horizon + Soroban RPC) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Geist font
│   ├── page.tsx            # Main page — wallet state, tx history
│   └── globals.css
├── components/
│   ├── WalletButton.tsx    # Connect/disconnect wallet, error display
│   ├── PaymentForm.tsx     # Add-to-queue form + Send All batch trigger
│   └── TransactionList.tsx # Live tx feed with status badges + explorer links
└── lib/
    ├── contract.ts         # Soroban contract client (recordPayment, getPayments)
    ├── stellar.ts          # Horizon payment functions (sendBatchPaymentWithWallet)
    ├── walletKit.ts        # Stellar Wallets Kit init & singleton
    └── errors.ts           # WalletNotFoundError, UserRejectedError, InsufficientBalanceError

contract/
├── Cargo.toml              # Soroban SDK dependency
└── src/
    └── lib.rs              # PaymentTracker contract (record_payment, get_payments)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Stellar testnet wallet browser extension (e.g. [Freighter](https://www.freighter.app/))
- Funded testnet account — use [Stellar Friendbot](https://friendbot.stellar.org/?addr=YOUR_ADDRESS)

### Installation

```bash
git clone <repo-url>
cd payment-tracker
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_CONTRACT_ID=CAOQVXHWVHX7TQMEBG7PXJ72PVHAIAWAYM4QJRWPM6CYVQIIB7HZA77U
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

### Payment Flow

1. Connect wallet via the **Connect Wallet** button
2. Enter a recipient Stellar address (`G…`) and an XLM amount
3. Click **Add to Queue** — add as many payments as needed
4. Click **Send All** — all queued payments are bundled into **one Stellar transaction** with multiple `Payment` operations
5. Wallet prompts for a **single signature**
6. Transaction is submitted; all entries flip from `PENDING` → `SUCCESS` (with tx hash) or `FAILED`

### Batch Transaction Design

All payments are packed into a single transaction to avoid sequence number collisions. This means:
- Only **one wallet confirmation** regardless of how many recipients are in the queue
- All payments succeed or fail **atomically**
- Fee = `BASE_FEE × number_of_operations`

### On-Chain History

After each successful batch, each payment is asynchronously recorded in the `PaymentTracker` Soroban contract via `record_payment`. On wallet connect, `get_payments` is called to load historical transactions into the UI.

---

## Smart Contract

The `PaymentTracker` Soroban contract (Rust) exposes two functions:

```rust
// Store a payment record (requires sender auth)
fn record_payment(env: Env, sender: Address, recipient: Address, amount: i128)

// Read all payments by sender
fn get_payments(env: Env, sender: Address) -> Vec<Payment>
```

### Building & Deploying

```bash
cd contract

# Build
cargo build --target wasm32-unknown-unknown --release

# Optimize
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/payment_tracker.wasm

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payment_tracker.optimized.wasm \
  --source <your-key-name> \
  --network testnet
```

---

## Error Handling

| Error | Trigger | UI Message |
|-------|---------|-----------|
| `WalletNotFoundError` | Wallet extension not installed | "Wallet extension not found. Please install it first." |
| `UserRejectedError` | User dismisses wallet modal | "Connection cancelled." |
| `InsufficientBalanceError` | Total send amount exceeds available balance | "Insufficient XLM balance. Required: X XLM, Available: Y XLM." |

---

## Available Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Links

- [Stellar Testnet Explorer](https://stellar.expert/explorer/testnet)
- [Soroban Docs](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [Freighter Wallet](https://www.freighter.app/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
