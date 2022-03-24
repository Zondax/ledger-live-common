export interface EstimatedFeesRequest {
  to: string;
  from: string;
}

export type EstimatedFeesResponse = number;

export interface TransactionsResponse {
  limit: number;
  offset: number;
  total: number;
  results: TransactionResponse[];
}

export interface TransactionResponse {
  tx: {
    tx_id: string;
    tx_status: string;
    tx_type: string;
    fee_rate: string;
    sender_address: string;
    sponsored: boolean;
    block_hash: string;
    block_height: number;
    tx_index: number;
    burn_block_time: number;
  };
  stx_transfers: {
    amount: string;
    sender: string;
    recipient: string;
  }[];
}

export interface BalanceResponse {
  balance: string;
}

export interface NetworkStatusResponse {
  server_version: string;
  status: string;
  chain_tip: BlockIdentifier;
}

export interface BroadcastTransactionRequest {
  message: {
    version: number;
    to: string;
    from: string;
    nonce: number;
    value: string;
    params: string;
  };
  signature: {
    type: number;
    data: string;
  };
}

export interface BroadcastTransactionResponse {
  hash: string;
}

interface BlockIdentifier {
  block_height: number;
  block_hash: string;
}
