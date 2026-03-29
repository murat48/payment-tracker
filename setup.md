### Adım 1 — Soroban kontratı için Copilot'a ver

```
Create a Soroban smart contract in Rust for Stellar testnet.

File: `contract/src/lib.rs`

Contract name: PaymentTracker

Functions:
1. record_payment(env: Env, sender: Address, recipient: Address, amount: i128)
   - requires sender.require_auth()
   - stores payment with timestamp

2. get_payments(env: Env, sender: Address) → Vec<Payment>
   - returns all payments by sender

Struct Payment:
- sender: Address
- recipient: Address
- amount: i128
- timestamp: u64

Also create `contract/Cargo.toml` with correct Soroban SDK dependencies.
```

---

### Adım 2 — Frontend entegrasyonu için Copilot'a ver

```
Extend the Stellar Payment Tracker frontend.

Update or create these files:

1. `lib/contract.ts`
   - Connect to deployed Soroban contract on testnet
   - Function: recordPayment(sender, recipient, amount)
   - Function: getPayments(sender)
   - Use @stellar/stellar-sdk

2. `lib/stellar.ts`
   - Function: sendPayment(fromKeypair, toAddress, amount)
   - Submit real XLM payment on Stellar testnet
   - Return transaction hash on success
   - Throw InsufficientBalanceError if balance too low

3. Update `components/PaymentForm.tsx`
   - "Send All" button triggers real transactions
   - Each tx: PENDING → SUCCESS or FAILED
   - Show real tx hash with link to:
     https://stellar.expert/explorer/testnet/tx/{hash}

4. Update `app/page.tsx`
   - On load: fetch payment history from contract
   - CONTRACT_ID from environment variable NEXT_PUBLIC_CONTRACT_ID
```
