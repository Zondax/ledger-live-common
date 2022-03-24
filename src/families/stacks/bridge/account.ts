import BlockstackApp from "@zondax/ledger-blockstack";
import { c32address } from "c32check";
import { getNonce } from "@stacks/transactions/dist/builders";
import { txidFromData } from "@stacks/transactions/dist/utils";
import { StacksNetwork, StacksMainnet } from "@stacks/network/dist";
import { log } from "@ledgerhq/logs";
import { intToBN } from "@stacks/common";
import { FeeNotLoaded } from "@ledgerhq/errors";
import {
  AnchorMode,
  UnsignedTokenTransferOptions,
  estimateTransfer,
  makeUnsignedSTXTokenTransfer,
} from "@stacks/transactions/dist";
import BN from "bn.js";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import {
  AddressVersion,
  TransactionVersion,
} from "@stacks/transactions/dist/constants";

import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  Operation,
  SignOperationEvent,
  SignOperationFnSignature,
  TransactionStatus,
} from "../../../types";
import { Transaction } from "../types";
import { getAccountShape, getTxToBroadcast } from "./utils/utils";
import { broadcastTx } from "./utils/api";
import { patchOperationWithHash } from "../../../operation";
import { getAddress } from "../../filecoin/bridge/utils/utils";
import { withDevice } from "../../../hw/deviceAccess";
import { close } from "../../../hw";
import { getPath, isError } from "../utils";
import { getMainAccount } from "../../../account";
import { fetchBalances } from "./utils/api";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");
  const options: UnsignedTokenTransferOptions = {
    anchorMode: AnchorMode.Any,
    recipient: "",
    publicKey: "",
    amount: new BN(0),
  };

  return {
    ...options,
    family: "stacks",
    useAllAmount: false,
    recipient: "",
    amount: new BigNumber(0),
  };
};

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => {
  // log("debug", "[updateTransaction] patching tx");

  return { ...t, ...patch };
};

const sync = makeSync(getAccountShape);

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, signature },
}) => {
  // log("debug", "[broadcast] start fn");

  const tx = getTxToBroadcast(operation, signature);

  const resp = await broadcastTx(tx);
  const { hash } = resp;

  const result = patchOperationWithHash(operation, hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { amount } = t;

  const estimatedFees = new BigNumber(0);
  const totalSpent = new BigNumber(0);

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  const { address } = getAddress(a);

  const balance = await fetchBalances(address);
  return new BigNumber(balance.balance); // FIXME Stacks - minus the tx fee from this
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(a);
  const { recipient } = t;

  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    const options: UnsignedTokenTransferOptions = {
      recipient,
      anchorMode: t.anchorMode,
      network: t.network,
      publicKey: t.publicKey,
      amount: t.amount.toFixed(),
      fee: -1, // Set fee to avoid makeUnsignedSTXTokenTransfer to fetch fees internally
      nonce: -1, // Set nonce to avoid makeUnsignedSTXTokenTransfer to fetch nonce internally
    };

    const tx = await makeUnsignedSTXTokenTransfer(options);
    const network = StacksNetwork.fromNameOrNetwork(
      t.network || new StacksMainnet()
    );

    const addressVersion =
      network.version === TransactionVersion.Mainnet
        ? AddressVersion.MainnetSingleSig
        : AddressVersion.TestnetSingleSig;
    const senderAddress = c32address(
      addressVersion,
      tx.auth.spendingCondition!.signer
    );

    const nonce = await getNonce(senderAddress, options.network);
    const fee = await estimateTransfer(tx);

    t.fee = fee;
    t.nonce = nonce;
  }

  // log("debug", "[prepareTransaction] finish fn");

  return t;
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { id: accountId, balance } = account;
          const { address, derivationPath } = getAddress(account);

          const {
            recipient,
            nonce,
            fee,
            useAllAmount,
            anchorMode,
            network,
            publicKey,
          } = transaction;
          let { amount } = transaction;

          if (!fee) {
            log("debug", `signOperation missingData --> fee=${fee} `);
            throw new FeeNotLoaded();
          }

          const blockstack = new BlockstackApp(transport);

          try {
            o.next({
              type: "device-signature-requested",
            });

            const feeBN = new BigNumber(intToBN(fee, false).toString());
            if (useAllAmount) amount = balance.minus(feeBN);

            const options: UnsignedTokenTransferOptions = {
              amount: transaction.amount.toFixed(),
              recipient,
              anchorMode,
              network,
              publicKey,
              fee,
              nonce,
            };

            const tx = await makeUnsignedSTXTokenTransfer(options);
            const serializedTx = tx.serialize();

            log(
              "debug",
              `[signOperation] serialized CBOR tx: [${serializedTx.toString(
                "hex"
              )}]`
            );

            // Sign by device
            const result = await blockstack.sign(
              getPath(derivationPath),
              serializedTx
            );
            isError(result);

            o.next({
              type: "device-signature-granted",
            });

            const txHash = txidFromData(serializedTx);

            // build signature on the correct format
            const signature = `${result.signature_compact.toString("base64")}`;

            const operation: Operation = {
              id: `${accountId}-${txHash}-OUT`,
              hash: txHash,
              type: "OUT",
              senders: [address],
              recipients: [recipient],
              accountId,
              value: amount,
              fee: feeBN,
              blockHash: null,
              blockHeight: null,
              date: new Date(),
              extra: {
                nonce,
                signatureType: 1,
              },
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
                expirationDate: null,
              },
            });
          } finally {
            close(transport, deviceId);

            // log("debug", "[signOperation] finish fn");
          }
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );
      })
  );

export const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  estimateMaxSpendable,
  signOperation,
  sync,
  receive,
  broadcast,
};
