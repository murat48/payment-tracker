"use client";

export type TxStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Transaction {
  id: string;
  recipient: string;
  amount: string;
  status: TxStatus;
  hash?: string;
  timestamp: number;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const statusConfig: Record<
  TxStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "PENDING",
    className: "bg-yellow-900/40 text-yellow-400 border border-yellow-700",
  },
  SUCCESS: {
    label: "SUCCESS",
    className: "bg-emerald-900/40 text-emerald-400 border border-emerald-700",
  },
  FAILED: {
    label: "FAILED",
    className: "bg-red-900/40 text-red-400 border border-red-700",
  },
};

export default function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Transactions</h2>
        <p className="text-sm text-zinc-500 text-center py-6">
          No transactions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white">
        Transactions ({transactions.length})
      </h2>

      <ul className="flex flex-col gap-3">
        {transactions
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((tx) => {
            const cfg = statusConfig[tx.status];
            return (
              <li
                key={tx.id}
                className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3 gap-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-sm text-zinc-300 truncate">
                    {tx.recipient.slice(0, 6)}…{tx.recipient.slice(-4)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <span className="text-sky-400 font-semibold text-sm shrink-0">
                  {tx.amount} XLM
                </span>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.className}`}
                >
                  {cfg.label}
                </span>

                {tx.hash ? (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-500 hover:text-sky-400 underline shrink-0"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-xs text-zinc-600 shrink-0">—</span>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
