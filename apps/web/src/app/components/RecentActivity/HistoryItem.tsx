import { motion } from 'framer-motion';
import React from 'react';
import IntentSwap from './transactions/IntentSwap';

interface HistoryItemProps {
  tx: any;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ tx }) => {
  // const hash = transaction.id.split('/')[1] || transaction.id;
  // const xChainId = isMMTransaction(transaction) ? transaction.fromAmount.currency.xChainId : transaction.sourceChainId;
  // const trackerLink = getTxTrackerLink(hash, xChainId);

  const handleClick = () => {
    alert('click');
  };

  const renderContent = () => {
    return <IntentSwap tx={tx} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      key={tx.id}
      onClick={handleClick}
      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
    >
      {renderContent()}
    </motion.div>
  );
};

export default HistoryItem;
