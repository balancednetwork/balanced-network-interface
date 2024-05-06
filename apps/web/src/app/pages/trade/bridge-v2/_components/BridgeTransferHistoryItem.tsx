import React, { useEffect } from 'react';

import { t } from '@lingui/macro';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { getNetworkDisplayName } from 'app/pages/trade/bridge-v2/utils';
import { Typography } from 'app/theme';
import ArrowIcon from 'assets/icons/arrow-white.svg';

import Spinner from '../../../../components/Spinner';
import { useXCallEventScanner } from '../_zustand/useXCallEventStore';
import { useFetchTransaction } from '../_zustand/useTransactionStore';
import { bridgeTransferHistoryActions, useFetchBridgeTransferEvents } from '../_zustand/useBridgeTransferHistoryStore';
import { useCreateXCallService } from '../_zustand/useXCallServiceStore';

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

const BridgeTransferHistoryItem = ({ transfer }) => {
  const {
    bridgeInfo: { bridgeDirection },
  } = transfer;
  useXCallEventScanner(bridgeDirection.from);
  useXCallEventScanner(bridgeDirection.to);

  useCreateXCallService(bridgeDirection.from);
  useCreateXCallService(bridgeDirection.to);

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

  return (
    <Wrap>
      <Flex alignItems="center">
        {getNetworkDisplayName(transfer.bridgeInfo.bridgeDirection.from)}
        <ArrowIcon width="13px" style={{ margin: '0 7px' }} />
        {getNetworkDisplayName(transfer.bridgeInfo.bridgeDirection.to)}
      </Flex>
      <Flex justifyContent="center" flexDirection="column">
        <Typography fontWeight={700} color="text">
          {'Transfer bnUSD'}
        </Typography>
        <Typography opacity={0.75} fontSize={14}>
          {'0.3 bnUSD'}
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
          <Spinner size={15} />
          <Status style={{ transform: 'translateY(1px)' }}>{transfer.status}</Status>
        </Flex>
      </Flex>
    </Wrap>
  );
};

export default BridgeTransferHistoryItem;
