import React from 'react';
import { Flex } from 'rebass';
import styled from 'styled-components';
import { Status } from './_styledComponents';

const DotsContainer = styled.div`
  display: flex;
  align-items: flex-end;
  margin-left: 3px;
  padding-bottom: 5px;
`;

const Dot = styled.span`
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background-color: currentColor;
  margin-right: 3px;
  animation: bounce 1.4s infinite ease-in-out;
  
  &:nth-of-type(1) {
    animation-delay: 0s;
  }
  
  &:nth-of-type(2) {
    animation-delay: 0.2s;
  }
  
  &:nth-of-type(3) {
    animation-delay: 0.4s;
    margin-right: 0;
  }

  @keyframes bounce {
    0%, 80%, 100% { 
      transform: scale(0);
    } 
    40% { 
      transform: scale(1.0);
    }
  }
`;

interface TransactionStatusProps {
  status: string;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({ status }) => {
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Flex alignItems="flex-end">
            <span>Pending</span>
            <DotsContainer>
              <Dot />
              <Dot />
              <Dot />
            </DotsContainer>
          </Flex>
        );
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return <Status>{getStatusText(status)}</Status>;
};

export default TransactionStatus;
