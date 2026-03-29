"use client";

import { useState } from "react";
import { InsufficientBalanceError } from "@/lib/errors";
import { sendBatchPaymentWithWallet } from "@/lib/stellar";
import { recordPayment } from "@/lib/contract";
import type { Transaction } from "@/components/TransactionList";

export interface QueuedPayment {
  id: string;
  recipient: string;
  amount: string;
}

interface PaymentFormProps {
  walletAddress: string | null;
  onQueueUpdate?: (queue: QueuedPayment[]) => void;
  onTransactionUpdate?: (tx: Transaction) => void;
}

export default function PaymentForm({
  walletAddress,
  onQueueUpdate,
  onTransactionUpdate,
}: PaymentFormProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [queue, setQueue] = useState<QueuedPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const walletConnected = !!walletAddress;

  function isValidAddress(addr: string) {
    return /^G[A-Z0-9]{55}$/.test(addr);
  }

  function addToQueue() {
    setError(null);

    if (!recipient.trim() || !isValidAddress(recipient.trim())) {
      setError("Invalid Stellar address. Must start with G and be 56 characters.");
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    const entry: QueuedPayment = {
      id: crypto.randomUUID(),
      recipient: recipient.trim(),
      amount: amount.trim(),
    };

    const updated = [...queue, entry];
    setQueue(updated);
    onQueueUpdate?.(updated);
    setRecipient("");
    setAmount("");
  }

  function removeFromQueue(id: string) {
    const updated = queue.filter((p) => p.id !== id);
    setQueue(updated);
    onQueueUpdate?.(updated);
  }

  async function handleSend() {
    if (queue.length === 0 || !walletAddress) return;
    setSending(true);
    setError(null);

    const snapshot = [...queue];
    setQueue([]);
    onQueueUpdate?.([]);

    // Mark all as PENDING before sending
    const now = Date.now();
    const pendingTxs: Transaction[] = snapshot.map((p) => ({
      id: p.id,
      recipient: p.recipient,
      amount: p.amount,
      status: "PENDING" as const,
      timestamp: now,
    }));
    pendingTxs.forEach((tx) => onTransactionUpdate?.(tx));

    try {
      // Single transaction, single wallet confirmation, no sequence issues
      const hash = await sendBatchPaymentWithWallet(
        walletAddress,
        snapshot.map((p) => ({ recipient: p.recipient, amount: p.amount }))
      );

      // Record each payment on-chain (non-blocking)
      snapshot.forEach((p) => {
        recordPayment(
          walletAddress,
          p.recipient,
          BigInt(Math.round(parseFloat(p.amount) * 1e7))
        ).catch(() => undefined);
      });

      pendingTxs.forEach((tx) =>
        onTransactionUpdate?.({ ...tx, status: "SUCCESS", hash })
      );
    } catch (err) {
      const msg =
        err instanceof InsufficientBalanceError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Transaction failed";
      pendingTxs.forEach((tx) =>
        onTransactionUpdate?.({ ...tx, status: "FAILED" })
      );
      setError(msg);
    }

    setSending(false);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-white">New Payment</h2>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Recipient Stellar address (G…)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={!walletConnected}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:opacity-40"
        />
        <input
          type="number"
          placeholder="Amount (XLM)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.0000001"
          disabled={!walletConnected}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-600 disabled:opacity-40"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={addToQueue}
          disabled={!walletConnected}
          className="w-full py-2.5 rounded-lg bg-sky-700 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          Add to Queue
        </button>
      </div>

      {queue.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <h3 className="text-sm font-medium text-zinc-400">
            Queued ({queue.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {queue.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-2.5 text-sm"
              >
                <span className="font-mono text-zinc-300 truncate max-w-50">
                  {p.recipient.slice(0, 6)}…{p.recipient.slice(-4)}
                </span>
                <span className="text-sky-400 font-semibold ml-2 shrink-0">
                  {p.amount} XLM
                </span>
                <button
                  onClick={() => removeFromQueue(p.id)}
                  className="ml-3 text-zinc-500 hover:text-red-400 transition-colors text-xs shrink-0"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full mt-1 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {sending ? "Sending…" : `Send All (${queue.length})`}
          </button>
        </div>
      )}

      {!walletConnected && (
        <p className="text-xs text-zinc-500 text-center">
          Connect your wallet to add payments.
        </p>
      )}
    </div>
  );
}
