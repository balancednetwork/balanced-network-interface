import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { XTransaction } from '../_zustand/types';
import { useXMessageStore, xMessageActions } from '../_zustand/useXMessageStore';
import XMessageHistoryItem from './XMessageHistoryItem';

const XTransactionHistoryItem = ({ xTransaction }: { xTransaction: XTransaction }) => {
  useXMessageStore();
  const { primaryMessageId, secondaryMessageId } = xTransaction;
  const primaryMessage = xMessageActions.get(primaryMessageId);
  const secondaryMessage = secondaryMessageId && xMessageActions.get(secondaryMessageId);

  return (
    <>
      {primaryMessage && <XMessageHistoryItem xMessage={primaryMessage} xTransaction={xTransaction} />}
      {secondaryMessage && (
        <XMessageHistoryItem xMessage={secondaryMessage} xTransaction={xTransaction} />
      )}
    </>
  );
};

export default XTransactionHistoryItem;
