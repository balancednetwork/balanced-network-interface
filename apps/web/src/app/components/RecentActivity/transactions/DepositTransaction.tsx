import { XTransaction } from '@balancednetwork/xwagmi';
import React from 'react';

interface DepositTransactionProps {
  transaction: XTransaction;
}

const DepositTransaction: React.FC<DepositTransactionProps> = ({ transaction }) => {
  return <div>Deposit Transaction</div>;
};

export default DepositTransaction;
