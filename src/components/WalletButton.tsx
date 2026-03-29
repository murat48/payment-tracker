"use client";

import { useState, useEffect, useRef } from "react";
import { StellarWalletsKit, initWalletKit } from "@/lib/walletKit";
import { parseWalletError, WalletNotFoundError, UserRejectedError } from "@/lib/errors";

interface WalletButtonProps {
  onAddressChange?: (address: string | null) => void;
}

export default function WalletButton({ onAddressChange }: WalletButtonProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initWalletKit();
    }
  }, []);

  function truncate(addr: string) {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const { address: addr } = await StellarWalletsKit.authModal();
      setAddress(addr);
      onAddressChange?.(addr);
    } catch (err) {
      const parsed = parseWalletError(err);
      if (parsed instanceof WalletNotFoundError) {
        setError("Wallet extension not found. Please install it first.");
      } else if (parsed instanceof UserRejectedError) {
        setError("Connection cancelled.");
      } else {
        setError(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    await StellarWalletsKit.disconnect();
    setAddress(null);
    onAddressChange?.(null);
    setError(null);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {address ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800">
            {truncate(address)}
          </span>
          <button
            onClick={disconnect}
            className="px-4 py-2 rounded-lg bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-800/60 text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {loading ? "Connecting…" : "Connect Wallet"}
        </button>
      )}
      {error && (
        <p className="text-xs text-red-400 max-w-xs text-right">{error}</p>
      )}
    </div>
  );
}
