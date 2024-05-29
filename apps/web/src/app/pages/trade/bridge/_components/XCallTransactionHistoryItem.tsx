import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { XCallTransaction } from '../_zustand/types';
import { useXMessageStore, xCallMessageActions } from '../_zustand/useXMessageStore';
import XMessageHistoryItem from './XMessageHistoryItem';

const XCallTransactionHistoryItem = ({ xCallTransaction }: { xCallTransaction: XCallTransaction }) => {
  useXMessageStore();
  const { primaryMessageId, secondaryMessageId } = xCallTransaction;
  const primaryMessage = xCallMessageActions.get(primaryMessageId);
  const secondaryMessage = secondaryMessageId && xCallMessageActions.get(secondaryMessageId);

  return (
    <>
      {primaryMessage && <XMessageHistoryItem xCallMessage={primaryMessage} xCallTransaction={xCallTransaction} />}
      {secondaryMessage && (
        <XMessageHistoryItem xCallMessage={secondaryMessage} xCallTransaction={xCallTransaction} />
      )}
    </>
  );
};

export default XCallTransactionHistoryItem;
