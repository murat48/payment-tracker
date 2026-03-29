I'm building a Stellar Payment Tracker with Next.js 14, TypeScript, and Tailwind CSS.

Create the following files:

1. `lib/walletKit.ts` — Initialize StellarWalletsKit with Freighter, Lobstr, xBull wallets

2. `lib/errors.ts` — Handle 3 error types:
   - WalletNotFoundError (extension not installed)
   - UserRejectedError (user dismissed connection)
   - InsufficientBalanceError (not enough XLM)

3. `components/WalletButton.tsx` — Connect/disconnect button, show truncated address

4. `components/PaymentForm.tsx` —
   - Input: recipient address
   - Input: XLM amount
   - "Add to Queue" button
   - List of queued payments

5. `components/TransactionList.tsx` —
   - Show each tx: address, amount, status badge
   - PENDING (yellow), SUCCESS (green), FAILED (red)
   - Placeholder explorer link

6. `app/page.tsx` — Main page combining all components, dark theme

Use mock transaction status for now. No smart contract yet.
