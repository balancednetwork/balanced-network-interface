// TODO: deprecated
import React, { useEffect, useMemo, useState } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import ArrowIcon from 'assets/icons/arrow-white.svg';

import Spinner from 'app/components/Spinner';
import { XMessage, XMessageStatus, XTransaction } from '../_zustand/types';
import { xMessageActions } from '../_zustand/useXMessageStore';

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

const XMessageHistoryItem = ({ xMessage, xTransaction }: { xMessage: XMessage; xTransaction: XTransaction }) => {
  const { sourceChainId, destinationChainId } = xMessage;

  const isPending = useMemo(() => {
    return xMessage.status !== XMessageStatus.FAILED && xMessage.status !== XMessageStatus.CALL_EXECUTED;
  }, [xMessage]);

  const statusMessage = useMemo(() => {
    switch (xMessage.status) {
      case XMessageStatus.FAILED:
        return `Failed`;
      case XMessageStatus.REQUESTED:
      case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
      case XMessageStatus.CALL_MESSAGE_SENT:
      case XMessageStatus.CALL_MESSAGE:
        return `Pending`;
      case XMessageStatus.CALL_EXECUTED:
        return `Complete`;
      default:
        return `Unknown`;
    }
  }, [xMessage]);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timestamp = xMessage.sourceTransaction.timestamp;

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

  const handleRemove = () => {
    xMessageActions.remove(xMessage.id);
  };

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
            {xTransaction.attributes?.descriptionAction}
          </Typography>
          <Typography opacity={0.75} fontSize={14}>
            {xTransaction.attributes?.descriptionAmount}
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
            <>
              <Flex alignItems="center">
                <Status style={{ transform: 'translateY(1px)' }}>{statusMessage}</Status>
              </Flex>

              <Typography color="alert" onClick={handleRemove} style={{ cursor: 'pointer' }}>
                REMOVE
              </Typography>
            </>
          )}
        </Flex>
      </Wrap>
    </>
  );
};

export default XMessageHistoryItem;
