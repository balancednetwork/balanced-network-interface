import { MMTransaction } from '@/store/transactions/useMMTransactionStore';
import { XTransaction, XTransactionType } from '@balancednetwork/xwagmi';
import React from 'react';
import BridgeTransaction from './transactions/BridgeTransaction';
import DepositTransaction from './transactions/DepositTransaction';
import SwapTransaction from './transactions/SwapTransaction';

interface HistoryItemProps {
  transaction: MMTransaction | XTransaction;
  isMMTransaction: (transaction: MMTransaction | XTransaction) => transaction is MMTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ transaction, isMMTransaction }) => {
  if (isMMTransaction(transaction)) {
    return <div>MM Transaction - ID: {transaction.id}</div>;
  }
  console.log(transaction.type);

  switch (transaction.type) {
    case XTransactionType.SWAP:
      return <SwapTransaction transaction={transaction} />;
    case XTransactionType.BRIDGE:
      return <BridgeTransaction transaction={transaction} />;
    case XTransactionType.DEPOSIT:
      return <DepositTransaction transaction={transaction} />;
    default:
      return <div>Unknown Transaction Type - ID: {transaction.id}</div>;
  }
};

export default HistoryItem;
