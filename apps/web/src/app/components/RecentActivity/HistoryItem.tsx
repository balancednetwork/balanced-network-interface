import { UnifiedTransaction } from '@/hooks/useCombinedTransactions';
import { getTxTrackerLink } from '@balancednetwork/xwagmi';
import React from 'react';
import IntentSwap from './transactions/IntentSwap';

interface HistoryItemProps {
  tx: UnifiedTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ tx }) => {
  const hash = tx.hash;

  const renderContent = () => {
    return <IntentSwap tx={tx} />;
  };

  return <div key={hash}>{renderContent()}</div>;
};

export default HistoryItem;
