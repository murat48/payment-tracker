import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "./walletKit";
import { InsufficientBalanceError } from "./errors";

const horizonServer = new Horizon.Server(
  "https://horizon-testnet.stellar.org",
  { allowHttp: false }
);

/** Minimum XLM reserve to keep in the account (base reserve + buffer) */
const MIN_RESERVE = 2;

export async function sendPayment(
  fromKeypair: Keypair,
  toAddress: string,
  amount: string
): Promise<string> {
  const account = await horizonServer.loadAccount(fromKeypair.publicKey());
  const xlmBalance =
    account.balances.find((b) => b.asset_type === "native")?.balance ?? "0";
  const available = parseFloat(xlmBalance) - MIN_RESERVE;

  if (parseFloat(amount) > available) {
    throw new InsufficientBalanceError(parseFloat(amount), available);
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: toAddress,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(fromKeypair);
  const result = await horizonServer.submitTransaction(tx);
  return result.hash;
}

export interface BatchPayment {
  recipient: string;
  amount: string;
}

/**
 * Build a single transaction with all payments as separate operations,
 * sign once with the wallet, and submit once.
 * This avoids sequence number issues entirely and requires only one wallet confirmation.
 */
export async function sendBatchPaymentWithWallet(
  fromAddress: string,
  payments: BatchPayment[]
): Promise<string> {
  const account = await horizonServer.loadAccount(fromAddress);
  const xlmBalance =
    account.balances.find((b) => b.asset_type === "native")?.balance ?? "0";
  const available = parseFloat(xlmBalance) - MIN_RESERVE;
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (totalAmount > available) {
    throw new InsufficientBalanceError(totalAmount, available);
  }

  const builder = new TransactionBuilder(account, {
    fee: String(parseInt(BASE_FEE) * payments.length),
    networkPassphrase: Networks.TESTNET,
  });

  for (const p of payments) {
    builder.addOperation(
      Operation.payment({
        destination: p.recipient,
        asset: Asset.native(),
        amount: p.amount,
      })
    );
  }

  const tx = builder.setTimeout(30).build();

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(
    tx.toXDR(),
    { address: fromAddress, networkPassphrase: Networks.TESTNET }
  );

  const { Transaction } = await import("@stellar/stellar-sdk");
  const signedTx = new Transaction(signedTxXdr, Networks.TESTNET);
  const result = await horizonServer.submitTransaction(signedTx);
  return result.hash;
}
