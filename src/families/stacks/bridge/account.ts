import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  SignOperationEvent,
  SignOperationFnSignature,
  TransactionStatus,
} from "../../../types";
import { Transaction } from "../types";
import { getAccountShape, getTxToBroadcast } from "./utils/utils";
import { broadcastTx } from "./utils/api";
import { patchOperationWithHash } from "../../../operation";
import { AnchorMode, UnsignedTokenTransferOptions } from "@stacks/transactions";
import BN from "bn.js";
import { BigNumber } from "bignumber.js";
import { getAddress } from "../../filecoin/bridge/utils/utils";
import { Observable } from "rxjs";
import { withDevice } from "../../../hw/deviceAccess";

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
  const balance = new BigNumber(0);
  return balance;
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  const { address } = getAddress(a);
  const { recipient } = t;

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
        async function main() {}

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
