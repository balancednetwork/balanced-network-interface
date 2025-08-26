import { UnifiedTransaction } from '@/hooks/useCombinedTransactions';
import { getTxTrackerLink } from '@balancednetwork/xwagmi';
import React from 'react';
import IntentSwap, { getTokenDataFromIntent } from './transactions/IntentSwap';

interface HistoryItemProps {
  tx: UnifiedTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ tx }) => {
  const hash = tx.hash;
  const tokenData = getTokenDataFromIntent(tx.data.intent);
  const trackerLinkSrc =
    typeof tx.data.packet.srcTxHash === 'string'
      ? getTxTrackerLink(tx.data.packet.srcTxHash, tokenData?.srcChainId)
      : '';
  const trackerLinkSonic =
    typeof tx.data.packet.dstTxHash === 'string' ? `https://sonicscan.org/tx/${tx.data.packet.dstTxHash}` : '';

  const handleClick = () => {
    trackerLinkSrc && window.open(trackerLinkSrc, '_blank');
    trackerLinkSonic && window.open(trackerLinkSonic, '_blank');
  };

  const renderContent = () => {
    return <IntentSwap tx={tx} />;
  };

  return (
    <div key={hash} onClick={handleClick} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
      {renderContent()}
    </div>
  );
};

export default HistoryItem;
