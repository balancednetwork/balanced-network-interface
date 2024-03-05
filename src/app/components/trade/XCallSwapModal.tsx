import React from 'react';

import { Currency, Percent, Token, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { ARCHWAY_FEE_TOKEN_SYMBOL, ARCHWAY_XCALL_NETWORK_ID, ICON_XCALL_NETWORK_ID } from 'app/_xcall/_icon/config';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import useAllowanceHandler from 'app/_xcall/archway/AllowanceHandler';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { useArchwayXcallFee } from 'app/_xcall/archway/eventHandler';
import { useARCH } from 'app/_xcall/archway/tokens';
import { getFeeParam, getXCallOriginEventDataFromArchway } from 'app/_xcall/archway/utils';
import { useXCallGasChecker } from 'app/_xcall/hooks';
import { CurrentXCallState, SupportedXCallChains, XCallEvent } from 'app/_xcall/types';
import { getArchwayCounterToken, getBytesFromString, getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useSwapSlippageTolerance } from 'store/application/hooks';
import { Field } from 'store/swap/actions';
import { useTransactionAdder } from 'store/transactions/hooks';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { useAddOriginEvent, useCurrentXCallState } from 'store/xCall/hooks';
import { formatBigNumber, shortenAddress, toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button, TextButton } from '../Button';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import Spinner from '../Spinner';
import { swapMessage } from './utils';
import XCallEventManager from './XCallEventManager';

type XCallSwapModalProps = {
  isOpen: boolean;
  currencies: { [field in Field]?: Currency };
  executionTrade?: Trade<Currency, Currency, TradeType>;
  clearInputs: () => void;
  originChain: SupportedXCallChains;
  destinationChain: SupportedXCallChains;
  destinationAddress?: string;
  onClose: () => void;
};

export const StyledButton = styled(Button)`
  position: relative;

  :after,
  :before {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    left: 0;
    border-radius: 5px;
    background: ${({ theme }) => theme.colors.primaryBright};
  }

  &:after {
    bottom: 0;
  }

  :before {
    top: 0;
  }

  @keyframes expand {
    0% {
      width: 0;
      left: 50%;
      opacity: 0;
    }
    50% {
      width: 28%;
      left: 36%;
      opacity: 1;
    }
    100% {
      width: 100%;
      left: 0%;
      opacity: 0;
    }
  }

  &:disabled {
    :after {
      animation: expand 2s infinite;
    }
  }
`;

export const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

const XCallSwapModal = ({
  isOpen,
  currencies,
  executionTrade,
  originChain,
  destinationChain,
  destinationAddress,
  clearInputs,
  onClose,
}: XCallSwapModalProps) => {
  const { account } = useIconReact();
  const { address: accountArch, signingClient } = useArchwayContext();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const [modalClosable, setModalClosable] = React.useState(true);
  const [xCallInProgress, setXCallInProgress] = React.useState(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const addTransaction = useTransactionAdder();
  const signedInWallets = useSignedInWallets();
  const addOriginEvent = useAddOriginEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { isTxPending } = useArchwayTransactionsState();
  const { data: archwayXcallFees } = useArchwayXcallFee();
  const { data: gasChecker } = useXCallGasChecker(originChain, destinationChain);
  const currentXCallState = useCurrentXCallState();
  const ARCH = useARCH();
  const originAddress = signedInWallets.find(wallet => wallet.chain === originChain)?.address;

  const { increaseAllowance, allowanceIncreased, isIncreaseNeeded: allowanceIncreaseNeeded } = useAllowanceHandler(
    (originChain === 'archway' && getArchwayCounterToken(executionTrade?.inputAmount.currency.symbol)?.address) || '',
    executionTrade?.inputAmount.quotient.toString() || '0',
  );

  const xCallReset = React.useCallback(() => {
    setXCallInProgress(false);
    setModalClosable(true);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    return () => onClose();
  }, [onClose]);

  const controlledClose = React.useCallback(() => {
    if (modalClosable && !xCallInProgress) {
      xCallReset();
    }
  }, [modalClosable, xCallInProgress, xCallReset]);

  const receivingNetworkAddress: string | undefined = React.useMemo(() => {
    if (destinationAddress) {
      if (destinationChain === 'icon') {
        return `${ICON_XCALL_NETWORK_ID}/${destinationAddress}`;
      }
      if (destinationChain === 'archway') {
        return `${ARCHWAY_XCALL_NETWORK_ID}/${destinationAddress}`;
      }
    }
  }, [destinationChain, destinationAddress]);

  const cleanupSwap = () => {
    clearInputs();
    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    changeShouldLedgerSign(false);
  };

  React.useEffect(() => {
    if (currentXCallState === CurrentXCallState.IDLE) {
      xCallReset();
      clearInputs();
    }
  }, [clearInputs, currentXCallState, xCallReset]);

  //todo: extract to method to handle other chains in the future
  const msgs = React.useMemo(() => {
    const swapMessages =
      executionTrade &&
      swapMessage(
        executionTrade.inputAmount.toFixed(2),
        executionTrade.inputAmount.currency.symbol || 'IN',
        executionTrade.outputAmount.toFixed(2),
        executionTrade.outputAmount.currency.symbol || 'OUT',
      );

    return {
      txMsgs: {
        icon: {
          pending: swapMessages?.pendingMessage || 'Swapping',
          summary: swapMessages?.successMessage || 'Swapped successfully',
        },
        archway: {
          pending: t`Transferring ${executionTrade?.outputAmount.currency.symbol || 'swap result'} to Archway...`,
          summary: t`Transferred ${executionTrade?.outputAmount.toFixed(2)} ${
            executionTrade?.outputAmount.currency.symbol || 'Swap result'
          } to Archway.`,
        },
      },
      managerMsgs: {
        icon: {
          awaiting: t`Awaiting message from ICON network`,
          actionRequired: t`Swap ${executionTrade?.inputAmount.currency.symbol || ''} for ${
            executionTrade?.outputAmount.currency.symbol || ''
          }.`,
        },
        archway: {
          awaiting: t`Awaiting message from Archway network`,
          actionRequired: t`Transfer ${executionTrade?.outputAmount.currency.symbol || ''} to Archway.`,
        },
      },
    };
  }, [executionTrade]);

  const handleICONTxResult = async (
    hash: string,
    descriptionAction: string = 'Default swap description',
    descriptionAmount: string = 'Default swap amount description',
  ) => {
    const txResult = await fetchTxResult(hash);

    if (txResult?.status === 1 && txResult.eventLogs.length) {
      const callMessageSentEvent = txResult.eventLogs.find(event =>
        event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
      );

      if (callMessageSentEvent) {
        //todo: find the destination event and determine destination for this new origin event
        const originEventData = getXCallOriginEventDataFromICON(
          callMessageSentEvent,
          'archway',
          descriptionAction,
          descriptionAmount,
        );
        originEventData && addOriginEvent('icon', originEventData);
      }
    }
  };

  const handleXCallSwap = async () => {
    if (!executionTrade) {
      return;
    }

    const swapMessages = swapMessage(
      executionTrade.inputAmount.toFixed(2),
      executionTrade.inputAmount.currency.symbol || 'IN',
      executionTrade.outputAmount.toFixed(2),
      executionTrade.outputAmount.currency.symbol || 'OUT',
    );

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
    const descriptionAction = t`Swap ${executionTrade.inputAmount.currency.symbol || ''} for ${
      executionTrade.outputAmount.currency.symbol || ''
    }`;
    const descriptionAmount = t`${executionTrade.inputAmount.toFixed(2)} ${
      executionTrade.inputAmount.currency.symbol || ''
    } for ${executionTrade.outputAmount.toFixed(2)} ${executionTrade.outputAmount.currency.symbol || ''}`;

    if (originChain === 'icon') {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }
      if (executionTrade.inputAmount.currency.symbol === 'ICX') {
        const { result: hash } = await bnJs
          .inject({ account })
          .Router.swapICX(
            toDec(executionTrade.inputAmount),
            executionTrade.route.pathForSwap,
            NETWORK_ID === 1 ? toDec(minReceived) : '0x0',
            receivingNetworkAddress,
          );
        if (hash) {
          setXCallInProgress(true);
          addTransaction(
            { hash },
            {
              pending: swapMessages.pendingMessage,
              summary: swapMessages.successMessage,
            },
          );
          await handleICONTxResult(hash, descriptionAction, descriptionAmount);
        }
        cleanupSwap();
      } else {
        const token = executionTrade.inputAmount.currency as Token;
        const outputToken = executionTrade.outputAmount.currency as Token;

        const cx = bnJs.inject({ account }).getContract(token.address);

        const { result: hash } = await cx.swapUsingRoute(
          toDec(executionTrade.inputAmount),
          outputToken.address,
          toDec(minReceived),
          executionTrade.route.pathForSwap,
          receivingNetworkAddress,
        );

        if (hash) {
          setXCallInProgress(true);
          addTransaction(
            { hash },
            {
              pending: swapMessages.pendingMessage,
              summary: swapMessages.successMessage,
            },
          );
          await handleICONTxResult(hash, descriptionAction, descriptionAmount);
        }
        cleanupSwap();
      }
    } else if (originChain === 'archway') {
      const archToken = getArchwayCounterToken(executionTrade.inputAmount.currency.symbol);
      if (!archToken || !(signingClient && accountArch)) {
        return;
      }

      const swapParams = {
        path: executionTrade.route.pathForSwap,
        ...(receivingNetworkAddress && { receiver: receivingNetworkAddress }),
      };

      initTransaction('archway', t`Requesting cross-chain swap...`);
      setXCallInProgress(true);
      //handle icon native tokens vs spoke assets
      if (['bnUSD'].includes(archToken.symbol!)) {
        const msg = {
          cross_transfer: {
            amount: executionTrade.inputAmount.quotient.toString(),
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data: getBytesFromString(
              JSON.stringify({
                method: '_swap',
                params: swapParams,
              }),
            ),
          },
        };

        try {
          const res = await signingClient.execute(
            accountArch,
            ARCHWAY_CONTRACTS.bnusd,
            msg,
            'auto',
            undefined,
            archwayXcallFees?.rollback && archwayXcallFees.rollback !== '0'
              ? [{ amount: archwayXcallFees?.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL }]
              : undefined,
          );

          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          addTransactionResult('archway', res, t`Cross-chain swap requested.`);
          originEventData && addOriginEvent('archway', originEventData);
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Swap request failed');
          setXCallInProgress(false);
        }
      } else {
        const msg = {
          deposit: {
            token_address: archToken.address,
            amount: executionTrade.inputAmount.quotient.toString(),
            to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
            data: getBytesFromString(
              JSON.stringify({
                method: '_swap',
                params: swapParams,
              }),
            ),
          },
        };

        const fee = await signingClient.queryContractSmart(ARCHWAY_CONTRACTS.xcall, {
          get_fee: { nid: `${ICON_XCALL_NETWORK_ID}`, rollback: true },
        });

        try {
          const res = await signingClient.execute(
            accountArch,
            ARCHWAY_CONTRACTS.assetManager,
            msg,
            getFeeParam(1500000),
            undefined,
            fee !== undefined && fee !== '0' ? [{ amount: fee, denom: ARCHWAY_FEE_TOKEN_SYMBOL }] : undefined,
          );

          addTransactionResult('archway', res, 'Cross-chain swap requested.');
          setXCallInProgress(true);
          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          originEventData && addOriginEvent('archway', originEventData);
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Swap request failed');
          setXCallInProgress(false);
        }
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onDismiss={controlledClose}>
      <ModalContentWrapper>
        <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
          <Trans>
            Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
          </Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center">
          <Trans>
            {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
              executionTrade?.executionPrice.quoteCurrency.symbol
            } 
              per ${executionTrade?.executionPrice.baseCurrency.symbol}`}
          </Trans>
        </Typography>

        <Flex my={4}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>Pay</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{getNetworkDisplayName(originChain)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{destinationAddress && originAddress && shortenAddress(originAddress, 5)}</Trans>
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>Receive</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.OUTPUT]?.symbol}
            </Typography>
            <Typography textAlign="center">
              <Trans>{getNetworkDisplayName(destinationChain)}</Trans>
            </Typography>
            <Typography textAlign="center">
              <Trans>{destinationAddress && shortenAddress(destinationAddress, 5)}</Trans>
            </Typography>
          </Box>
        </Flex>

        <Typography
          textAlign="center"
          hidden={currencies[Field.INPUT]?.symbol === 'ICX' && currencies[Field.OUTPUT]?.symbol === 'sICX'}
        >
          <Trans>Includes a fee of</Trans>{' '}
          <strong>
            {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
            {currencies[Field.INPUT]?.symbol}
          </strong>
          .
        </Typography>
        {originChain === 'archway' && archwayXcallFees && (
          <Typography textAlign="center">
            <Trans>You'll also pay</Trans>{' '}
            <strong>{(Number(archwayXcallFees.rollback) / 10 ** ARCH.decimals).toPrecision(3)} ARCH</strong>{' '}
            <Trans>to transfer cross-chain.</Trans>
          </Typography>
        )}

        <XCallEventManager
          xCallReset={xCallReset}
          clearInputs={clearInputs}
          executionTrade={executionTrade}
          msgs={msgs}
        />

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
                    >{t`Approve ${executionTrade?.inputAmount.currency.symbol} for cross-chain transfer.`}</Typography>
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
              <TextButton
                onClick={() => {
                  setXCallInProgress(false);
                  onClose();
                }}
              >
                <Trans>Cancel</Trans>
              </TextButton>
              {allowanceIncreaseNeeded && !xCallInProgress ? (
                <Button disabled={true}>Swap</Button>
              ) : gasChecker && !gasChecker.hasEnoughGas ? (
                <Button disabled={true}>Swap</Button>
              ) : (
                <StyledButton onClick={handleXCallSwap} disabled={xCallInProgress}>
                  {!xCallInProgress ? <Trans>Swap</Trans> : <Trans>xCall in progress</Trans>}
                </StyledButton>
              )}
            </>
          )}
        </Flex>
      </ModalContentWrapper>
    </Modal>
  );
};

export default XCallSwapModal;
