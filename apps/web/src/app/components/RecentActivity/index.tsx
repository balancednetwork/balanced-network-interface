import { useCombinedTransactions } from '@/hooks/useCombinedTransactions';
import React from 'react';

const RecentActivity: React.FC = () => {
  const { transactions, isMMTransaction } = useCombinedTransactions();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
      {transactions.length === 0 ? (
        <div>No activity to display.</div>
      ) : (
        <ul>
          {transactions.map(transaction => (
            <li key={transaction.id}>
              {isMMTransaction(transaction) ? 'MM Transaction' : 'X Transaction'} - {transaction.id.slice(0, 6)}...
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;
