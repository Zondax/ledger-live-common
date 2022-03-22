import { Account, Address, Operation } from "../../../../types";
import { BigNumber } from "bignumber.js";
import { GetAccountShape } from "../../../../bridge/jsHelpers";
import { encodeAccountId } from "../../../../account";

export const getTxToBroadcast = (
  operation: Operation,
  signature: string
): any => {};

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "",
  });

  // FIXME - Fetch correct values here
  const result = {
    id: accountId,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operations: [],
    blockHeight: 0,
  };

  return result;
};
