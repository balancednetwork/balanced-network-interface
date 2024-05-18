import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { getNetworkDisplayName } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import ArrowIcon from 'assets/icons/arrow-white.svg';

import Spinner from 'app/components/Spinner';
import { BridgeTransferStatusUpdater } from '../_zustand/useBridgeTransferHistoryStore';
import { BridgeTransfer, BridgeTransferStatus, BridgeTransferType } from '../_zustand/types';

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

  const statusMessage = useMemo(() => {
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
        return `Complete`;
      default:
        return `Unknown`;
    }
  }, [transfer]);

  const { descriptionAction, descriptionAmount } = useMemo(() => {
    let descriptionAction, descriptionAmount;

    if (!transfer) {
      return { descriptionAction, descriptionAmount };
    }

    if (transfer.type === BridgeTransferType.BRIDGE) {
      const _tokenSymbol = transfer.xSwapInfo.inputAmount.currency.symbol;
      const _formattedAmount = transfer.xSwapInfo.inputAmount.toFixed(2);

      descriptionAction = `Transfer ${_tokenSymbol}`;
      descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
    } else if (transfer.type === BridgeTransferType.SWAP) {
      const { executionTrade } = transfer.xSwapInfo;
      const _inputTokenSymbol = executionTrade?.inputAmount.currency.symbol || '';
      const _outputTokenSymbol = executionTrade?.outputAmount.currency.symbol || '';
      const _inputAmount = executionTrade?.inputAmount.toFixed(2);
      const _outputAmount = executionTrade?.outputAmount.toFixed(2);

      descriptionAction = `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`;
      descriptionAmount = `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`;
    }

    return { descriptionAction, descriptionAmount };
  }, [transfer]);

  return (
    <>
      <BridgeTransferStatusUpdater transfer={transfer} />
      <Wrap>
        <Flex alignItems="center">
          {getNetworkDisplayName(sourceChainId)}
          <ArrowIcon width="13px" style={{ margin: '0 7px' }} />
          {getNetworkDisplayName(destinationChainId)}
        </Flex>
        <Flex justifyContent="center" flexDirection="column">
          <Typography fontWeight={700} color="text">
            {descriptionAction}
          </Typography>
          <Typography opacity={0.75} fontSize={14}>
            {descriptionAmount}
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
            <Status style={{ transform: 'translateY(1px)' }}>{statusMessage}</Status>
          </Flex>
        </Flex>
      </Wrap>
    </>
  );
};

export default BridgeTransferHistoryItem;
