import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import { Account, Address, Operation } from "../../../../types";
import {
  GetAccountShape,
  GetAccountShapeArg0,
} from "../../../../bridge/jsHelpers";
import { encodeAccountId } from "../../../../account";
import {
  fetchBalances,
  fetchBlockHeight,
  fetchTxs,
} from "../../bridge/utils/api";
import { TransactionResponse } from "./types";

export const getTxToBroadcast = (
  operation: Operation,
  signature: string
): any => {};

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const mapTxToOps =
  (id, { address }: GetAccountShapeArg0) =>
  (tx: TransactionResponse): Operation[] => {
    const ops: Operation[] = [];

    return ops;
  };

export const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "",
  });

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalances(address);
  const rawTxs = await fetchTxs(address);

  const result = {
    id: accountId,
    balance: new BigNumber(balance.balance),
    spendableBalance: new BigNumber(balance.balance),
    operations: flatMap(rawTxs, mapTxToOps(accountId, info)),
    blockHeight: blockHeight.chain_tip.block_height,
  };

  return result;
};
