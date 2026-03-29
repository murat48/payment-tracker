import {
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "./walletKit";

const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL, { allowHttp: false });

export interface Payment {
  sender: string;
  recipient: string;
  amount: bigint;
  timestamp: number;
}

function getContract(): Contract {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  if (!contractId) throw new Error("NEXT_PUBLIC_CONTRACT_ID is not set");
  return new Contract(contractId);
}

export async function getPayments(senderAddress: string): Promise<Payment[]> {
  const contract = getContract();
  const account = await server.getAccount(senderAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call("get_payments", new Address(senderAddress).toScVal())
    )
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(result)) throw new Error(result.error);

  const retval = (result as rpc.Api.SimulateTransactionSuccessResponse).result
    ?.retval;
  if (!retval) return [];

  const raw = scValToNative(retval) as Array<{
    sender: string;
    recipient: string;
    amount: bigint;
    timestamp: bigint;
  }>;

  return raw.map((p) => ({
    sender: p.sender,
    recipient: p.recipient,
    amount: p.amount,
    timestamp: Number(p.timestamp),
  }));
}

export async function recordPayment(
  senderAddress: string,
  recipient: string,
  amount: bigint
): Promise<void> {
  const contract = getContract();
  const account = await server.getAccount(senderAddress);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "record_payment",
        new Address(senderAddress).toScVal(),
        new Address(recipient).toScVal(),
        nativeToScVal(amount, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) throw new Error(simResult.error);

  tx = rpc.assembleTransaction(tx, simResult).build();

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(
    tx.toXDR(),
    { address: senderAddress, networkPassphrase: Networks.TESTNET }
  );

  const { Transaction } = await import("@stellar/stellar-sdk");
  const signedTx = new Transaction(signedTxXdr, Networks.TESTNET);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(
      `Transaction failed: ${sendResult.errorResult?.toString() ?? "unknown error"}`
    );
  }

  let getResult = await server.getTransaction(sendResult.hash);
  let attempts = 0;
  while (getResult.status === "NOT_FOUND" && attempts < 10) {
    await new Promise((r) => setTimeout(r, 2000));
    getResult = await server.getTransaction(sendResult.hash);
    attempts++;
  }

  if (getResult.status === "FAILED") {
    throw new Error("Contract call failed on-chain");
  }
}
