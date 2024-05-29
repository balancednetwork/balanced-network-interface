import React, { useEffect, useMemo, useState } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import ArrowIcon from 'assets/icons/arrow-white.svg';

import Spinner from 'app/components/Spinner';
import { XCallMessage, XCallMessageStatus, XCallTransaction } from '../_zustand/types';

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
    grid-template-columns: 3.8fr 4fr 3fr;
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

const XCallMessageHistoryItem = ({
  xCallMessage,
  xCallTransaction,
}: { xCallMessage: XCallMessage; xCallTransaction: XCallTransaction }) => {
  const { sourceChainId, destinationChainId } = xCallMessage;

  const isPending = useMemo(() => {
    return (
      xCallMessage.status !== XCallMessageStatus.FAILED && xCallMessage.status !== XCallMessageStatus.CALL_EXECUTED
    );
  }, [xCallMessage]);

  const statusMessage = useMemo(() => {
    switch (xCallMessage.status) {
      case XCallMessageStatus.FAILED:
        return `Failed`;
      case XCallMessageStatus.REQUESTED:
      case XCallMessageStatus.AWAITING_CALL_MESSAGE_SENT:
      case XCallMessageStatus.CALL_MESSAGE_SENT:
      case XCallMessageStatus.CALL_MESSAGE:
        return `Pending`;
      case XCallMessageStatus.CALL_EXECUTED:
        return `Complete`;
      default:
        return `Unknown`;
    }
  }, [xCallMessage]);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timestamp = xCallMessage.sourceTransaction.timestamp;

  useEffect(() => {
    if (isPending) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - timestamp) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timestamp, isPending]);

  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  return (
    <>
      <Wrap>
        <Flex alignItems="center">
          {getNetworkDisplayName(sourceChainId)}
          <ArrowIcon width="13px" style={{ margin: '0 7px' }} />
          {getNetworkDisplayName(destinationChainId)}
        </Flex>
        <Flex justifyContent="center" flexDirection="column">
          <Typography fontWeight={700} color="text">
            {xCallTransaction.attributes?.descriptionAction}
          </Typography>
          <Typography opacity={0.75} fontSize={14}>
            {xCallTransaction.attributes?.descriptionAmount}
          </Typography>
        </Flex>
        <Flex justifyContent="center" flexDirection="column" alignItems="flex-end" className="status-check">
          {isPending ? (
            <>
              <Flex alignItems="center">
                <Spinner size={15} />
                <Status style={{ transform: 'translateY(1px)' }}>{statusMessage}</Status>
              </Flex>
              <Typography opacity={0.75} fontSize={14}>
                {elapsedTime ? `${minutes ? minutes + 'm' : ''} ${seconds}s` : '...'}
              </Typography>
            </>
          ) : (
            <Flex alignItems="center">
              <Status style={{ transform: 'translateY(1px)' }}>{statusMessage}</Status>
            </Flex>
          )}
        </Flex>
      </Wrap>
    </>
  );
};

export default XCallMessageHistoryItem;
