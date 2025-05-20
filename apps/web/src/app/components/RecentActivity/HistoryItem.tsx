import { MMTransaction } from '@/store/transactions/useMMTransactionStore';
import { XTransaction, XTransactionType, getTxTrackerLink } from '@balancednetwork/xwagmi';
import { motion } from 'framer-motion';
import React from 'react';
import BridgeTransaction from './transactions/BridgeTransaction';
import CollateralTransaction from './transactions/CollateralTransaction';
import DepositXTokenTransaction from './transactions/DepositXTokenTransaction';
import LPStakeTransaction from './transactions/LPStakeTransaction';
import LPTransaction from './transactions/LPTransaction';
import LoanTransaction from './transactions/LoanTransaction';
import MMSwapTransaction from './transactions/MMSwapTransaction';
import RewardsFeesTransaction from './transactions/RewardsFeesTransaction';
import RewardsLPTransaction from './transactions/RewardsLPTransaction';
import RewardsSavingsTransaction from './transactions/RewardsSavingsTransaction';
import SavingsTransaction from './transactions/SavingsTransaction';
import SwapTransaction from './transactions/SwapTransaction';

interface HistoryItemProps {
  transaction: MMTransaction | XTransaction;
  isMMTransaction: (transaction: MMTransaction | XTransaction) => transaction is MMTransaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ transaction, isMMTransaction }) => {
  const hash = transaction.id.split('/')[1] || transaction.id;
  const xChainId = isMMTransaction(transaction) ? transaction.fromAmount.currency.xChainId : transaction.sourceChainId;
  const trackerLink = getTxTrackerLink(hash, xChainId);

  const handleClick = () => {
    if (trackerLink) {
      window.open(trackerLink, '_blank');
    }
  };

  const renderContent = () => {
    if (isMMTransaction(transaction)) {
      return <MMSwapTransaction transaction={transaction} />;
    }

    switch (transaction.type) {
      //Swap
      case XTransactionType.SWAP:
      case XTransactionType.SWAP_ON_ICON:
        return <SwapTransaction transaction={transaction} />;

      //Bridge
      case XTransactionType.BRIDGE:
        return <BridgeTransaction transaction={transaction} />;

      // Collateral
      case XTransactionType.DEPOSIT_ON_ICON:
      case XTransactionType.DEPOSIT:
      case XTransactionType.WITHDRAW:
      case XTransactionType.WITHDRAW_ON_ICON:
        return <CollateralTransaction transaction={transaction} />;

      //Loan
      case XTransactionType.BORROW:
      case XTransactionType.REPAY:
      case XTransactionType.BORROW_ON_ICON:
      case XTransactionType.REPAY_ON_ICON:
        return <LoanTransaction transaction={transaction} />;

      //Liquidity
      case XTransactionType.LP_REMOVE_LIQUIDITY:
      case XTransactionType.LP_ADD_LIQUIDITY:
        return <LPTransaction transaction={transaction} />;
      case XTransactionType.LP_DEPOSIT_XTOKEN:
      case XTransactionType.LP_WITHDRAW_XTOKEN:
        return <DepositXTokenTransaction transaction={transaction} />;
      case XTransactionType.LP_UNSTAKE:
      case XTransactionType.LP_STAKE:
        return <LPStakeTransaction transaction={transaction} />;

      //Savings
      case XTransactionType.SAVINGS_LOCK_BNUSD:
      case XTransactionType.SAVINGS_UNLOCK_BNUSD:
        return <SavingsTransaction transaction={transaction} />;

      //Rewards
      case XTransactionType.LP_CLAIM_REWARDS:
        return <RewardsLPTransaction transaction={transaction} />;
      case XTransactionType.SAVINGS_CLAIM_REWARDS:
        return <RewardsSavingsTransaction transaction={transaction} />;
      case XTransactionType.CLAIM_NETWORK_FEES:
        return <RewardsFeesTransaction transaction={transaction} />;

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
      onClick={handleClick}
      style={{ cursor: trackerLink ? 'pointer' : 'default', pointerEvents: trackerLink ? 'auto' : 'none' }}
    >
      {renderContent()}
    </motion.div>
  );
};

export default HistoryItem;
