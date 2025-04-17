import { MMTransaction } from '@/store/transactions/useMMTransactionStore';
import { XTransaction, XTransactionType } from '@balancednetwork/xwagmi';
import { motion } from 'framer-motion';
import React from 'react';
import BridgeTransaction from './transactions/BridgeTransaction';
import CollateralTransaction from './transactions/CollateralTransaction';
import MMSwapTransaction from './transactions/MMSwapTransaction';
import SwapTransaction from './transactions/SwapTransaction';

interface HistoryItemProps {
  transaction: MMTransaction | XTransaction;
  isMMTransaction: (transaction: MMTransaction | XTransaction) => transaction is MMTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ transaction, isMMTransaction }) => {
  const renderContent = () => {
    if (isMMTransaction(transaction)) {
      return <MMSwapTransaction transaction={transaction} />;
    }

    switch (transaction.type) {
      case XTransactionType.SWAP:
      case XTransactionType.SWAP_ON_ICON:
        return <SwapTransaction transaction={transaction} />;
      case XTransactionType.BRIDGE:
        return <BridgeTransaction transaction={transaction} />;
      case XTransactionType.DEPOSIT:
      case XTransactionType.WITHDRAW:
      case XTransactionType.DEPOSIT_ON_ICON:
      case XTransactionType.WITHDRAW_ON_ICON:
        return <CollateralTransaction transaction={transaction} />;
      default:
        return <div>Unknown Transaction Type - {transaction.type}</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      key={transaction.id}
    >
      {renderContent()}
    </motion.div>
  );
};

export default HistoryItem;
