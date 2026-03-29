"use client";

import { useState, useEffect, useCallback } from "react";
import WalletButton from "@/components/WalletButton";
import PaymentForm from "@/components/PaymentForm";
import TransactionList, { Transaction } from "@/components/TransactionList";
import { getPayments } from "@/lib/contract";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadHistory = useCallback(async (address: string) => {
    try {
      const payments = await getPayments(address);
      const historical: Transaction[] = payments.map((p) => ({
        id: `${p.sender}-${p.recipient}-${p.timestamp}`,
        recipient: p.recipient,
        amount: (Number(p.amount) / 1e7).toFixed(7),
        status: "SUCCESS" as const,
        timestamp: p.timestamp * 1000,
      }));
      setTransactions(historical);
    } catch {
      // Contract not deployed yet or NEXT_PUBLIC_CONTRACT_ID not set — skip silently
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      loadHistory(walletAddress);
    } else {
      setTransactions([]);
    }
  }, [walletAddress, loadHistory]);

  function handleTransactionUpdate(tx: Transaction) {
    setTransactions((prev) => {
      const idx = prev.findIndex((t) => t.id === tx.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = tx;
        return updated;
      }
      return [tx, ...prev];
    });
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
          walletAddress={walletAddress}
          onTransactionUpdate={handleTransactionUpdate}
        />
        <TransactionList transactions={transactions} />
      </main>
    </div>
  );
}
