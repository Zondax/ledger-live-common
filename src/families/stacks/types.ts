import {
  BroadcastArg0,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types";
import { UnsignedTokenTransferOptions } from "@stacks/transactions/dist";

type FamilyType = "stacks";

export type NetworkInfo = {
  family: FamilyType;
};
export type NetworkInfoRaw = {
  family: FamilyType;
};

export type Transaction = Omit<UnsignedTokenTransferOptions, "amount"> &
  TransactionCommon & {
    family: FamilyType;
  };

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  nonce: number;
  version: number;
  chainId: number;
  anchorMode: number;
  postConditionMode: number;
};

export type BroadcastFnSignature = (arg0: BroadcastArg0) => Promise<Operation>;

export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;
export const reflect = (_declare: any) => {};
