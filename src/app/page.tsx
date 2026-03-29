"use client";

import { useState } from "react";
import WalletButton from "@/components/WalletButton";
import PaymentForm, { QueuedPayment } from "@/components/PaymentForm";
import TransactionList, { Transaction } from "@/components/TransactionList";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  function handleSend(payments: QueuedPayment[]) {
    const statuses = ["PENDING", "SUCCESS", "FAILED"] as const;
    const newTransactions: Transaction[] = payments.map((p) => ({
      id: crypto.randomUUID(),
      recipient: p.recipient,
      amount: p.amount,
      // Mock status — random for demo
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: Date.now(),
    }));
    setTransactions((prev) => [...newTransactions, ...prev]);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Stellar Payment Tracker
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Testnet</p>
        </div>
        <WalletButton onAddressChange={setWalletAddress} />
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <PaymentForm
          walletConnected={!!walletAddress}
          onSend={handleSend}
        />
        <TransactionList transactions={transactions} />
      </main>
    </div>
  );
}
