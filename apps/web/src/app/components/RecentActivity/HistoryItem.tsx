import { MMTransaction } from '@/store/transactions/useMMTransactionStore';
import { XTransaction } from '@balancednetwork/xwagmi';
import React from 'react';

interface HistoryItemProps {
  transaction: MMTransaction | XTransaction;
  isMMTransaction: (transaction: MMTransaction | XTransaction) => transaction is MMTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ transaction, isMMTransaction }) => {
  return (
    <div>
      {isMMTransaction(transaction) ? 'MM Transaction' : 'X Transaction'} - {transaction.id.slice(0, 6)}...
    </div>
  );
};

export default HistoryItem;
