export class WalletNotFoundError extends Error {
  constructor(walletName = "Wallet") {
    super(
      `${walletName} extension is not installed. Please install it and try again.`
    );
    this.name = "WalletNotFoundError";
  }
}

export class UserRejectedError extends Error {
  constructor() {
    super("Connection request was rejected by the user.");
    this.name = "UserRejectedError";
  }
}

export class InsufficientBalanceError extends Error {
  constructor(required: number, available: number) {
    super(
      `Insufficient XLM balance. Required: ${required} XLM, Available: ${available} XLM.`
    );
    this.name = "InsufficientBalanceError";
  }
}

export function parseWalletError(error: unknown): Error {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not installed") || msg.includes("not found")) {
      return new WalletNotFoundError();
    }
    if (
      msg.includes("rejected") ||
      msg.includes("cancelled") ||
      msg.includes("canceled") ||
      msg.includes("denied")
    ) {
      return new UserRejectedError();
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}
