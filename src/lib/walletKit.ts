import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit.tech/stellar-wallets-kit";

export function initWalletKit() {
  StellarWalletsKit.init({
    modules: defaultModules(),
  });
  StellarWalletsKit.setNetwork(Networks.TESTNET);
}

export { StellarWalletsKit };
