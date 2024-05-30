import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { XCallTransaction } from '../_zustand/types';
import { useXCallMessageStore, xCallMessageActions } from '../_zustand/useXCallMessageStore';
import XCallMessageHistoryItem from './XCallMessageHistoryItem';

const XCallTransactionHistoryItem = ({ xCallTransaction }: { xCallTransaction: XCallTransaction }) => {
  useXCallMessageStore();
  const { primaryMessageId, secondaryMessageId } = xCallTransaction;
  const primaryMessage = xCallMessageActions.get(primaryMessageId);
  const secondaryMessage = secondaryMessageId && xCallMessageActions.get(secondaryMessageId);

  return (
    <>
      {primaryMessage && <XCallMessageHistoryItem xCallMessage={primaryMessage} xCallTransaction={xCallTransaction} />}
      {secondaryMessage && (
        <XCallMessageHistoryItem xCallMessage={secondaryMessage} xCallTransaction={xCallTransaction} />
      )}
    </>
  );
};

export default XCallTransactionHistoryItem;
