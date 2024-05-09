import React from 'react';

import { Trans, t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import useAllowanceHandler from 'app/pages/trade/bridge-v2/_hooks/useApproveCallback';
import { archway } from 'app/pages/trade/bridge-v2/_config/xChains';
import { Typography } from 'app/theme';
import { useShouldLedgerSign } from 'store/application/hooks';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useAddTransactionResult, useInitTransaction } from 'store/transactionsCrosschain/hooks';
import { useArchwayTransactionsState } from 'store/transactionsCrosschain/hooks';
import { useAddOriginEvent } from 'store/xCall/hooks';

import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { getFeeParam, getXCallOriginEventDataFromArchway } from 'app/_xcall/archway/utils';
import { CROSS_TRANSFER_TOKENS } from 'app/pages/trade/bridge-v2/_config/xTokens';
import { XCallEventType } from 'app/pages/trade/bridge-v2/types';
import bnJs from 'bnJs';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { ModalContentWrapper } from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import XCallEventManager from 'app/components/trade/XCallEventManager';
import { presenceVariants, StyledButton as XCallButton } from 'app/pages/trade/_components/XCallSwapModal';
import { StdFee } from '@archwayhq/arch3.js';
import { getNetworkDisplayName } from 'app/pages/trade/bridge-v2/utils';
import LiquidFinanceIntegration from './LiquidFinanceIntegration';
import useXCallFee from '../../bridge-v2/_hooks/useXCallFee';
import useXCallGasChecker from '../../bridge-v2/_hooks/useXCallGasChecker';

const StyledXCallButton = styled(XCallButton)`
  transition: all 0.2s ease;

  &.disabled {
    background: rgba(255, 255, 255, 0.15);
    pointer-events: none;
    cursor: not-allowed;
  }
`;

export default function BridgeTransferConfirmModal({
  isOpen,
  onDismiss,
  closeModal,
  xCallReset,
  xCallInProgress,
  setXCallInProgress,
}) {
  const { currency: currencyToBridge, recipient: destinationAddress, isLiquidFinanceEnabled } = useBridgeState();
  const { isDenom, currencyAmountToBridge, account } = useDerivedBridgeInfo();

  const { signingClient } = useArchwayContext();

  const bridgeDirection = useBridgeDirection();

  const { data: gasChecker } = useXCallGasChecker(bridgeDirection.from, bridgeDirection.to);

  const shouldLedgerSign = useShouldLedgerSign();

  const { isTxPending } = useArchwayTransactionsState();

  const {
    increaseAllowance,
    allowanceIncreased,
    isIncreaseNeeded: allowanceIncreaseNeeded,
  } = useAllowanceHandler(
    bridgeDirection.from === 'archway-1' && !isDenom ? currencyToBridge : undefined,
    `${currencyAmountToBridge ? currencyAmountToBridge.quotient : '0'}`,
  );

  const msgs = {
    txMsgs: {
      icon: {
        pending: t`Transferring ${currencyAmountToBridge?.currency.symbol} to ${getNetworkDisplayName(
          bridgeDirection.to,
        )}...`,
        summary: t`Transferred ${currencyAmountToBridge?.toFixed(2)} ${
          currencyAmountToBridge?.currency.symbol
        } to ${getNetworkDisplayName(bridgeDirection.to)}.`,
      },
      archway: {
        pending: t`Transferring ${currencyAmountToBridge?.currency.symbol} to ${getNetworkDisplayName(
          bridgeDirection.to,
        )}...`,
        summary: t`Transferred ${currencyAmountToBridge?.toFixed(2)} ${
          currencyAmountToBridge?.currency.symbol
        } to ${getNetworkDisplayName(bridgeDirection.to)}.`,
      },
    },
    managerMsgs: {
      icon: {
        awaiting: t`Awaiting icon manager message`,
        actionRequired: t`Send ${currencyAmountToBridge?.currency.symbol} to ${getNetworkDisplayName(
          bridgeDirection.to,
        )}.`,
      },
      archway: {
        awaiting: t`Awaiting archway manager message`,
        actionRequired: t`Send ${currencyAmountToBridge?.currency.symbol} to ${getNetworkDisplayName(
          bridgeDirection.to,
        )}.`,
      },
    },
  };

  const addTransaction = useTransactionAdder();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addOriginEvent = useAddOriginEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { xCallFee } = useXCallFee(bridgeDirection.from, bridgeDirection.to);

  const descriptionAction = `Transfer ${currencyToBridge?.symbol}`;
  const descriptionAmount = `${currencyAmountToBridge?.toFixed(2)} ${currencyAmountToBridge?.currency.symbol}`;

  const handleICONTxResult = async (hash: string) => {
    const txResult = await fetchTxResult(hash);

    if (txResult?.status === 1 && txResult.eventLogs.length) {
      const callMessageSentEvent = txResult.eventLogs.find(event =>
        event.indexed.includes(getICONEventSignature(XCallEventType.CallMessageSent)),
      );

      if (callMessageSentEvent) {
        const originEventData = getXCallOriginEventDataFromICON(
          callMessageSentEvent,
          bridgeDirection.to,
          descriptionAction,
          descriptionAmount,
        );
        addOriginEvent(bridgeDirection.from, originEventData);
      }
    }
  };

  const handleBridgeConfirm = async () => {
    if (!currencyAmountToBridge) return;
    if (!xCallFee) return;
    if (!account) return;

    const messages = {
      pending: `Requesting cross-chain transfer...`,
      summary: `Cross-chain transfer requested.`,
    };

    if (bridgeDirection.from === '0x1.icon') {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        const cx = bnJs.inject({ account }).getContract(tokenAddress);
        const { result: hash } = await cx.crossTransfer(
          destination,
          `${currencyAmountToBridge.quotient}`,
          xCallFee.rollback.toString(),
        );
        if (hash) {
          setXCallInProgress(true);
          addTransaction(
            { hash },
            {
              pending: messages.pending,
              summary: messages.summary,
            },
          );
          await handleICONTxResult(hash);
        }
      } else {
        const { result: hash } = await bnJs
          .inject({ account })
          .AssetManager[isLiquidFinanceEnabled ? 'withdrawNativeTo' : 'withdrawTo'](
            `${currencyAmountToBridge.quotient}`,
            tokenAddress,
            destination,
            xCallFee.rollback.toString(),
          );
        if (hash) {
          setXCallInProgress(true);
          addTransaction(
            { hash },
            {
              pending: messages.pending,
              summary: messages.summary,
            },
          );
          await handleICONTxResult(hash);
        }
      }
    } else if (bridgeDirection.from === 'archway-1' && signingClient) {
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        try {
          initTransaction(bridgeDirection.from, `Requesting cross-chain transfer...`);
          setXCallInProgress(true);

          const res = await signingClient.execute(
            account,
            contract,
            msg,
            fee,
            undefined,
            xCallFee.rollback !== 0n
              ? [
                  { amount: xCallFee.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL },
                  ...(assetToBridge ? [assetToBridge] : []),
                ]
              : assetToBridge
                ? [assetToBridge]
                : undefined,
          );

          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          addTransactionResult(bridgeDirection.from, res, t`Cross-chain transfer requested.`);
          originEventData && addOriginEvent(bridgeDirection.from, originEventData);
        } catch (e) {
          console.error(e);
          addTransactionResult(bridgeDirection.from, null, 'Cross-chain transfer request failed');
          setXCallInProgress(false);
        }
      };

      if (isDenom) {
        const msg = { deposit_denom: { denom: tokenAddress, to: destination, data: [] } };
        const assetToBridge = {
          denom: tokenAddress,
          amount: `${currencyAmountToBridge.quotient}`,
        };

        executeTransaction(msg, archway.contracts.assetManager, getFeeParam(1200000), assetToBridge);
      } else {
        if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
          const msg = {
            cross_transfer: {
              amount: `${currencyAmountToBridge.quotient}`,
              to: destination,
              data: [],
            },
          };

          executeTransaction(msg, tokenAddress, 'auto');
        } else {
          const msg = {
            deposit: {
              token_address: tokenAddress,
              amount: `${currencyAmountToBridge.quotient}`,
              to: destination,
              data: [],
            },
          };

          executeTransaction(msg, archway.contracts.assetManager, getFeeParam(1200000));
        }
      }
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={onDismiss}>
        <ModalContentWrapper>
          <Typography textAlign="center" mb="5px">
            {t`Transfer asset cross-chain?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${currencyAmountToBridge?.toFixed(2)} ${currencyAmountToBridge?.currency.symbol}`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>From</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {getNetworkDisplayName(bridgeDirection.from)}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>To</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {getNetworkDisplayName(bridgeDirection.to)}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center" mb="2px">
            {`${getNetworkDisplayName(bridgeDirection.to)} `}
            <Trans>address</Trans>
          </Typography>

          <Typography variant="p" textAlign="center" margin={'auto'} maxWidth={225} fontSize={16}>
            {destinationAddress}
          </Typography>

          <LiquidFinanceIntegration />

          <XCallEventManager xCallReset={xCallReset} msgs={msgs} />

          {/* Handle allowance */}
          {gasChecker && gasChecker.hasEnoughGas && (
            <AnimatePresence>
              {!xCallInProgress && allowanceIncreaseNeeded && !allowanceIncreased && (
                <motion.div key="allowance-handler" {...presenceVariants} style={{ overflow: 'hidden' }}>
                  <Box pt={3}>
                    <Flex
                      pt={3}
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      className="border-top"
                    >
                      <Typography
                        pb={4}
                      >{t`Approve ${currencyAmountToBridge?.currency.symbol} for cross-chain transfer.`}</Typography>
                      {!isTxPending && allowanceIncreaseNeeded && !allowanceIncreased && (
                        <Button onClick={increaseAllowance}>Approve</Button>
                      )}
                      {isTxPending && <Button disabled>Approving...</Button>}
                    </Flex>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {gasChecker && !gasChecker.hasEnoughGas && (
            <Typography mt={4} mb={-1} textAlign="center" color="alert">
              {gasChecker.errorMessage || t`Not enough gas to complete the swap.`}
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={closeModal}>
                  <Trans>Cancel</Trans>
                </TextButton>
                {allowanceIncreaseNeeded && !xCallInProgress ? (
                  <Button disabled>Transfer</Button>
                ) : (
                  <StyledXCallButton
                    onClick={handleBridgeConfirm}
                    disabled={xCallInProgress}
                    // className={isNativeVersionAvailable && withdrawNative === undefined ? 'disabled' : ''}
                  >
                    {!xCallInProgress ? <Trans>Transfer</Trans> : <Trans>xCall in progress</Trans>}
                  </StyledXCallButton>
                )}
              </>
            )}
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  );
}
