import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { XCallTransaction } from '../_zustand/types';
import { useXMessageStore, xMessageActions } from '../_zustand/useXMessageStore';
import XMessageHistoryItem from './XMessageHistoryItem';

const XCallTransactionHistoryItem = ({ xCallTransaction }: { xCallTransaction: XCallTransaction }) => {
  useXMessageStore();
  const { primaryMessageId, secondaryMessageId } = xCallTransaction;
  const primaryMessage = xMessageActions.get(primaryMessageId);
  const secondaryMessage = secondaryMessageId && xMessageActions.get(secondaryMessageId);

  return (
    <>
      {primaryMessage && <XMessageHistoryItem xMessage={primaryMessage} xCallTransaction={xCallTransaction} />}
      {secondaryMessage && (
        <XMessageHistoryItem xMessage={secondaryMessage} xCallTransaction={xCallTransaction} />
      )}
    </>
  );
};

export default XCallTransactionHistoryItem;
