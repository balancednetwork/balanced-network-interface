import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { XTransaction } from '../_zustand/types';
import { useXMessageStore, xMessageActions } from '../_zustand/useXMessageStore';
import XMessageHistoryItem from './XMessageHistoryItem';

const XTransactionHistoryItem = ({ xCallTransaction }: { xCallTransaction: XTransaction }) => {
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

export default XTransactionHistoryItem;
