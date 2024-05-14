import React, { useEffect, useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import ArrowIcon from 'assets/icons/arrow-white.svg';

import Spinner from 'app/components/Spinner';
import { useXCallEventScanner } from '../_zustand/useXCallEventStore';
import { useFetchTransaction } from '../_zustand/useTransactionStore';
import { bridgeTransferHistoryActions, useFetchBridgeTransferEvents } from '../_zustand/useBridgeTransferHistoryStore';
import { useCreateXCallService } from '../_zustand/useXCallServiceStore';
import { BridgeTransfer, BridgeTransferStatus } from '../_zustand/types';

const Wrap = styled(Box)`
  display: grid;
  grid-template-columns: 4fr 3fr 3fr;
  grid-gap: 15px;
  width: 100%;
  padding-bottom: 20px;

  @media (min-width: 800px) and (max-width: 1049px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    * {
      text-align: center;
      align-items: center !important;
    }
  }

  @media (max-width: 580px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    * {
      text-align: center;
      align-items: center !important;
    }
  }

  @media (min-width: 1050px) {
    display: grid;
    grid-template-columns: 3fr 4fr 3fr;
  }
`;

const Status = styled(Typography)`
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-left: 10px;
`;

const FailedX = styled(Box)`
  width: 10px;
  height: 15px;
  margin-right: 10px;

  :before {
    content: 'X';
    display: block;
    font-size: 16px;
    line-height: 1.03;
    color: ${({ theme }) => theme.colors.alert};
  }
`;

const BridgeTransferHistoryItem = ({ transfer }: { transfer: BridgeTransfer }) => {
  const { sourceChainId, destinationChainId } = transfer;
  useXCallEventScanner(sourceChainId);
  useXCallEventScanner(destinationChainId);

  useCreateXCallService(sourceChainId);
  useCreateXCallService(destinationChainId);

  const { rawTx } = useFetchTransaction(transfer?.sourceTransaction);
  const { events } = useFetchBridgeTransferEvents(transfer);

  const { id } = transfer;

  useEffect(() => {
    if (rawTx) {
      bridgeTransferHistoryActions.updateSourceTransaction(id, { rawTx });
    }
  }, [rawTx, id]);

  useEffect(() => {
    if (events) {
      bridgeTransferHistoryActions.updateTransferEvents(id, events);
    }
  }, [events, id]);

  const message = useMemo(() => {
    if (!transfer) {
      return `Transfer not found.`;
    }

    switch (transfer.status) {
      case BridgeTransferStatus.TRANSFER_FAILED:
        return `Failed`;
      case BridgeTransferStatus.TRANSFER_REQUESTED:
      case BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT:
      case BridgeTransferStatus.CALL_MESSAGE_SENT:
      case BridgeTransferStatus.CALL_MESSAGE:
        return `Pending`;
      case BridgeTransferStatus.CALL_EXECUTED:
        return `Call Executed`;
      default:
        return `Unknown`;
    }
  }, [transfer]);

  return (
    <Wrap>
      <Flex alignItems="center">
        {getNetworkDisplayName(sourceChainId)}
        <ArrowIcon width="13px" style={{ margin: '0 7px' }} />
        {getNetworkDisplayName(destinationChainId)}
      </Flex>
      <Flex justifyContent="center" flexDirection="column">
        <Typography fontWeight={700} color="text">
          {transfer.descriptionAction}
        </Typography>
        <Typography opacity={0.75} fontSize={14}>
          {transfer.descriptionAmount}
        </Typography>
      </Flex>
      <Flex justifyContent="center" flexDirection="column" alignItems="flex-end" className="status-check">
        {/* <>
          <Flex alignItems="center">
            <Spinner size={15} />
            <Status style={{ transform: 'translateY(1px)' }}>pending</Status>
          </Flex>
          <Typography opacity={0.75} fontSize={14}>
            10m 20s
          </Typography>
        </> */}

        <Flex alignItems="center">
          {transfer.status !== BridgeTransferStatus.TRANSFER_FAILED &&
            transfer.status !== BridgeTransferStatus.CALL_EXECUTED && <Spinner size={15} />}
          <Status style={{ transform: 'translateY(1px)' }}>{message}</Status>
        </Flex>
      </Flex>
    </Wrap>
  );
};

export default BridgeTransferHistoryItem;
