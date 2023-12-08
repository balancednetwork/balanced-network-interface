export type ICONTxEvent = {
  indexed: string[];
  data: string[];
  scoreAddress: string;
};

export type ICONTxResultType = {
  status: number; // 1 = success, 0 = failure
  blockHash: string;
  blockHeight: number;
  txHash: string;
  eventLogs: ICONTxEvent[];
};

export type ICONBlockType = {
  confirmedTransactionList: { txHash: string; timestamp: number }[];
};
