// @flow

import type { BigNumber } from "bignumber.js";
import type {
  Account as WalletAccount,
  SerializedAccount as WalletSerializedAccount,
} from "wallet-btc";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type CoreStatics = {};

export type CoreAccountSpecifics = {};

export type CoreOperationSpecifics = {};

export type CoreCurrencySpecifics = {};

export type BitcoinInput = {
  address: ?string,
  value: ?BigNumber,
  previousTxHash: ?string, // FIXME Probably useless
  previousOutputIndex: number, // FIXME Probably useless
};

export type BitcoinInputRaw = [?string, ?string, ?string, number];

export type BitcoinOutput = {
  hash: string,
  outputIndex: number,
  blockHeight: ?number,
  address: ?string,
  path: ?string,
  value: BigNumber,
  rbf: boolean,
};

export type BitcoinOutputRaw = [
  string,
  number,
  ?number,
  ?string,
  ?string,
  string,
  number // rbf 0/1 for compression
];

export type BitcoinResources = {
  utxos: BitcoinOutput[],
  walletAccount: WalletAccount,
};

export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[],
  walletAccount: WalletSerializedAccount,
};

export const BitcoinLikeFeePolicy = Object.freeze({
  PER_BYTE: "PER_BYTE",
  PER_KBYTE: "PER_KBYTE",
});

export const BitcoinLikeSigHashType = Object.freeze({
  SIGHASH_ALL: Buffer.from([0x01]),
  SIGHASH_NONE: Buffer.from([0x02]),
  SIGHASH_SINGLE: Buffer.from([0x03]),
  SIGHASH_FORKID: Buffer.from([0x40]),
  SIGHASH_ANYONECANPAY: Buffer.from([0x80]),
});

// TODO maybe not all fields are useful
export type BitcoinLikeNetworkParameters = {
  // Name of the network.
  identifier: string,
  // Version of the Pay To Public Hash standard.
  P2PKHVersion: Buffer,
  // Version of the Pay To Script Hash standard.
  P2SHVersion: Buffer,
  // Version of the Extended Public Key standard.
  xpubVersion: Buffer,
  // Policy to use when expressing fee amount, values in BitcoinLikeFeePolicy
  feePolicy: string,
  // Minimal amount a UTXO should have before being considered BTC dust.
  dustAmount: BigNumber,
  // Constant prefix to prepend all signature messages.
  messagePrefix: string,
  // Are transactions encoded with timestamp?
  usesTimestampedTransaction: boolean,
  // Delay applied to all timestamps. Used to debounce transactions.
  timestampDelay: BigNumber,
  // Bitcoin signature flag indicating what part of a transaction a signature signs, values in BitcoinLikeSigHashType
  sigHash: Buffer,
  // Addition BIPs enabled for this network.
  additionalBIPs: string[],
};

export type FeeItem = {
  key: string,
  speed: string,
  feePerByte: BigNumber,
};

export type FeeItems = {
  items: FeeItem[],
  defaultFeePerByte: BigNumber,
};

export type FeeItemRaw = {
  key: string,
  speed: string,
  feePerByte: string,
};

export type FeeItemsRaw = {
  items: FeeItemRaw[],
  defaultFeePerByte: string,
};

export type NetworkInfo = {|
  family: "bitcoin",
  feeItems: FeeItems,
|};

export type NetworkInfoRaw = {|
  family: "bitcoin",
  feeItems: FeeItemsRaw,
|};

export const bitcoinPickingStrategy = {
  DEEP_OUTPUTS_FIRST: 0,
  OPTIMIZE_SIZE: 1,
  MERGE_OUTPUTS: 2,
};

export type BitcoinPickingStrategy = $Values<typeof bitcoinPickingStrategy>;

// FIXME (legacy) the UtxoStrategy level should be flattened back in Transaction
export type UtxoStrategy = {
  strategy: BitcoinPickingStrategy,
  pickUnconfirmedRBF: boolean,
  excludeUTXOs: Array<{
    hash: string,
    outputIndex: number,
  }>,
};

// TODO Add inputs, outputs, fees... any other missing fields
export type Transaction = {|
  ...TransactionCommon,
  family: "bitcoin",
  utxoStrategy: UtxoStrategy,
  rbf: boolean,
  feePerByte: ?BigNumber,
  fees: ?BigNumber,
  networkInfo: ?NetworkInfo,
|};

export type TransactionRaw = {|
  ...TransactionCommonRaw,
  family: "bitcoin",
  utxoStrategy: UtxoStrategy,
  rbf: boolean,
  feePerByte: ?string,
  fees: ?string,
  networkInfo: ?NetworkInfoRaw,
|};

export const reflect = (_declare: *) => {};
