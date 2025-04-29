import React from 'react';
import { Flex } from 'rebass';
import styled from 'styled-components';
import Spinner from '../../Spinner';
import { Status } from './_styledComponents';

interface TransactionStatusProps {
  status: string;
}

const SpinnerWrap = styled.div`
  margin-left: 6px;
  position: relative;

  top: -4px;
`;

const TransactionStatusDisplay: React.FC<TransactionStatusProps> = ({ status }) => {
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Flex alignItems="center" style={{ position: 'relative', transform: 'translateY(1px)' }}>
            <span>Pending</span>
            <SpinnerWrap>
              <Spinner size={14} />
            </SpinnerWrap>
          </Flex>
        );
      case 'completed':
      case 'success':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return <Status>{getStatusText(status)}</Status>;
};

export default TransactionStatusDisplay;
