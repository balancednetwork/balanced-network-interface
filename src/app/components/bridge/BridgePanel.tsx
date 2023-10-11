import React from 'react';

import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { ICON_XCALL_NETWORK_ID } from 'app/_xcall/_icon/config';
import { useIconXcallFee } from 'app/_xcall/_icon/eventHandlers';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import useAllowanceHandler from 'app/_xcall/archway/AllowanceHandler';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { getXCallOriginEventDataFromArchway } from 'app/_xcall/archway/ArchwayTest/helpers';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { useArchwayXcallFee } from 'app/_xcall/archway/eventHandler';
import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';
import { SupportedXCallChains, XCallEvent } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useBridgeDirection, useSetBridgeDestination, useSetBridgeOrigin } from 'store/bridge/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';
import { useCrossChainWalletBalances } from 'store/wallet/hooks';
import { useAddOriginEvent, useStopListening } from 'store/xCall/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import AddressInputPanel from '../AddressInputPanel';
import { Button, TextButton } from '../Button';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import { CurrencySelectionType } from '../SearchModal/CurrencySearch';
import Spinner from '../Spinner';
import { AutoColumn } from '../trade/SwapPanel';
import { BrightPanel } from '../trade/utils';
import XCallEventManager from '../trade/XCallEventManager';
import { presenceVariants, StyledButton } from '../trade/XCallSwapModal';
import ChainSelector from './ChainSelector';

export default function BridgePanel() {
  const { account } = useIconReact();
  const { address: accountArch, signingClient } = useArchwayContext();
  const crossChainWallet = useCrossChainWalletBalances();
  const bridgeDirection = useBridgeDirection();
  const setBridgeOrigin = useSetBridgeOrigin();
  const setBridgeDestination = useSetBridgeDestination();
  const addTransaction = useTransactionAdder();
  // const hasEnoughICX = useHasEnoughICX();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const [currencyToBridge, setCurrencyToBridge] = React.useState<Currency | undefined>();
  const [amountToBridge, setAmountToBridge] = React.useState<string>('');
  const [destinationAddress, setDestinationAddress] = React.useState<string>('');
  const [inputUntouched, setInputUntouched] = React.useState(true);
  const [modalClosable, setModalClosable] = React.useState(true);
  const [xCallInProgress, setXCallInProgress] = React.useState(false);
  const addOriginEvent = useAddOriginEvent();
  const stopListening = useStopListening();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { isTxPending } = useArchwayTransactionsState();
  const { data: archwayXcallFees } = useArchwayXcallFee();
  const { data: iconXcallFees } = useIconXcallFee();
  const [isOpen, setOpen] = React.useState(false);

  const handleSetOriginChain = React.useCallback(
    (chain: SupportedXCallChains) => {
      if (chain === bridgeDirection.to) {
        setBridgeDestination(bridgeDirection.from);
      }
      setBridgeOrigin(chain);
      setCurrencyToBridge(undefined);
    },
    [bridgeDirection.from, bridgeDirection.to, setBridgeDestination, setBridgeOrigin],
  );

  const handleSetDestinationChain = React.useCallback(
    (chain: SupportedXCallChains) => {
      if (chain === bridgeDirection.from) {
        setBridgeOrigin(bridgeDirection.to);
      }
      setBridgeDestination(chain);
      setCurrencyToBridge(undefined);
    },
    [bridgeDirection.from, bridgeDirection.to, setBridgeDestination, setBridgeOrigin],
  );

  const handleTypeInput = (value: string) => {
    setAmountToBridge(value);
    setPercentAmount(undefined);
  };

  const handleInputSelect = (currency: Currency) => {
    setCurrencyToBridge(currency);
  };

  const [percentAmount, setPercentAmount] = React.useState<number | undefined>();

  const handleInputPercentSelect = (percent: number) => {
    setPercentAmount(percent);
  };

  const currencyAmountToBridge = React.useMemo(() => {
    if (currencyToBridge && amountToBridge) {
      return CurrencyAmount.fromRawAmount(
        currencyToBridge.wrapped,
        new BigNumber(amountToBridge).times(10 ** currencyToBridge.wrapped.decimals).toFixed(),
      );
    }
    return undefined;
  }, [amountToBridge, currencyToBridge]);

  const parsedAmount = React.useMemo(() => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (currencyAmount) {
      if (percentAmount) {
        return currencyAmount.multiply(new Fraction(percentAmount, 100)).toExact();
      } else {
        return amountToBridge;
      }
    }
    return '';
  }, [amountToBridge, bridgeDirection.from, crossChainWallet, currencyToBridge, percentAmount]);

  const { increaseAllowance, allowanceIncreased, isIncreaseNeeded: allowanceIncreaseNeeded } = useAllowanceHandler(
    (bridgeDirection.from === 'archway' && currencyToBridge?.wrapped.address) || '',
    currencyAmountToBridge?.quotient.toString() || '0',
  );

  const handleDestinationAddressInput = (value: string) => {
    setInputUntouched(false);
    setDestinationAddress(value);
  };

  React.useEffect(() => {
    if (!destinationAddress && inputUntouched) {
      if (bridgeDirection.to === 'icon') {
        setDestinationAddress(account || '');
      }
      if (bridgeDirection.to === 'archway') {
        setDestinationAddress(accountArch || '');
      }
    }
  }, [account, accountArch, destinationAddress, bridgeDirection.to, inputUntouched, setDestinationAddress]);

  React.useEffect(() => {
    return () => {
      setDestinationAddress('');
      setInputUntouched(true);
    };
  }, [setDestinationAddress, bridgeDirection.to]);

  const xCallReset = React.useCallback(() => {
    stopListening();
    setXCallInProgress(false);
    setModalClosable(true);
    setOpen(false);
  }, [stopListening]);

  const controlledClose = React.useCallback(() => {
    if (modalClosable && !xCallInProgress) {
      xCallReset();
    }
  }, [modalClosable, xCallInProgress, xCallReset]);

  const isBridgeButtonAvailable = React.useMemo(() => {
    if (!currencyAmountToBridge) return false;
    if (bridgeDirection.from === 'icon' && !account) return false;
    if (bridgeDirection.from === 'archway' && !accountArch) return false;
    if (!currencyAmountToBridge?.greaterThan(0)) return false;
    //todo: add check for available balance
    return true;
  }, [account, accountArch, bridgeDirection.from, currencyAmountToBridge]);

  const handleICONTxResult = async (hash: string) => {
    const txResult = await fetchTxResult(hash);
    console.log('xCall debug - ICON tx - ', txResult);
    if (txResult?.status === 1 && txResult.eventLogs.length) {
      const callMessageSentEvent = txResult.eventLogs.find(event =>
        event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
      );

      if (callMessageSentEvent) {
        console.log('xCall debug - CallMessageSent event detected', callMessageSentEvent);
        const originEventData = getXCallOriginEventDataFromICON(callMessageSentEvent);
        originEventData && addOriginEvent('icon', originEventData);
      }
    }
  };

  const handleBridgeConfirm = async () => {
    if (!currencyAmountToBridge) return;
    const messages = {
      pending: `Transferring ${currencyAmountToBridge?.toFixed(2)} ${
        currencyAmountToBridge?.currency.symbol
      } to ${getNetworkDisplayName(bridgeDirection.to)}.`,
      summary: `Successfully transferred ${currencyAmountToBridge?.currency.symbol} to ${getNetworkDisplayName(
        bridgeDirection.to,
      )}.`,
    };
    if (bridgeDirection.from === 'icon' && account && iconXcallFees) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to === 'archway' ? 'archway/' : ''}${destinationAddress}`;

      if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        const cx = bnJs.inject({ account }).getContract(tokenAddress);
        const { result: hash } = await cx.crossTransfer(
          destination,
          currencyAmountToBridge.quotient.toString(),
          parseInt(iconXcallFees.rollback, 16).toString(),
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
      } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        const { result: hash } = await bnJs
          .inject({ account })
          .AssetManager.withdrawTo(
            currencyAmountToBridge.quotient.toString(),
            tokenAddress,
            destination,
            parseInt(iconXcallFees.rollback, 16).toString(),
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
    } else if (bridgeDirection.from === 'archway' && accountArch && signingClient && archwayXcallFees) {
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to === 'icon' ? `${ICON_XCALL_NETWORK_ID}/` : ''}${destinationAddress}`;

      if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        const msg = {
          cross_transfer: {
            amount: currencyAmountToBridge.quotient.toString(),
            to: destination,
            data: [],
          },
        };
        try {
          initTransaction('archway', `Sending bridge request to ICON network`);
          setXCallInProgress(true);
          const res = await signingClient.execute(accountArch, tokenAddress, msg, 'auto', undefined, [
            { amount: archwayXcallFees.rollback, denom: NETWORK_ID === 1 ? 'aarch' : 'aconst' },
          ]);
          console.log('xCall debug - Archway bridge init tx:', res);
          const originEventData = getXCallOriginEventDataFromArchway(res.events);
          addTransactionResult('archway', res, 'Bridge request sent');
          originEventData && addOriginEvent('archway', originEventData);
          //todo: clear inputs
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Bridge request failed');
          setXCallInProgress(false);
        }
      } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        try {
          const msg = {
            deposit: {
              token_address: tokenAddress,
              amount: currencyAmountToBridge.quotient.toString(),
              to: destination,
              data: [],
            },
          };
          initTransaction('archway', `Sending bridge request to ICON network`);
          setXCallInProgress(true);
          const res = await signingClient.execute(accountArch, ARCHWAY_CONTRACTS.assetManager, msg, 'auto', undefined, [
            { amount: archwayXcallFees.rollback, denom: NETWORK_ID === 1 ? 'aarch' : 'aconst' },
          ]);
          console.log('xCall debug - Archway bridge init tx:', res);
          const originEventData = getXCallOriginEventDataFromArchway(res.events);
          addTransactionResult('archway', res, 'Bridge request sent');
          originEventData && addOriginEvent('archway', originEventData);
          //todo: clear inputs
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Bridge request failed');
          setXCallInProgress(false);
        }
      }
    }
  };

  const msgs = {
    txMsgs: {
      icon: {
        pending: t`Pending icon tx message`,
        summary: t`Summary icon tx message`,
      },
      archway: {
        pending: t`Pending archway tx message`,
        summary: t`Summary archway tx message`,
      },
    },
    managerMsgs: {
      icon: {
        awaiting: t`Awaiting icon manager message`,
        actionRequired: t`Action required icon manager message`,
      },
      archway: {
        awaiting: t`Awaiting archway manager message`,
        actionRequired: t`Action required archway manager message`,
      },
    },
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Bridge</Trans>
          </Typography>
          <Flex width="100%" alignItems="flex-start" justifyContent="space-between">
            <ChainSelector label="from" chain={bridgeDirection.from} setChain={handleSetOriginChain} />
            <ChainSelector label="to" chain={bridgeDirection.to} setChain={handleSetDestinationChain} />
          </Flex>

          <Flex>
            <CurrencyInputPanel
              account={account}
              value={parsedAmount}
              // currency={currencyToBridge || bnUSD[NETWORK_ID]}
              currency={currencyToBridge}
              selectedCurrency={currencyToBridge}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={!!account ? handleInputPercentSelect : undefined}
              percent={percentAmount}
              currencySelectionType={CurrencySelectionType.BRIDGE}
              showCommunityListControl={false}
            />
          </Flex>

          <Flex>
            <AddressInputPanel
              value={destinationAddress}
              onUserInput={handleDestinationAddressInput}
              placeholder={t`${getNetworkDisplayName(bridgeDirection.to)} address`}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Bridge</Trans>
            </Typography>

            <Typography color="text">
              IBC
              <QuestionWrapper style={{ marginLeft: '3px', transform: 'translateY(1px)' }}>
                <QuestionHelper text={t`IBC explained`}></QuestionHelper>
              </QuestionWrapper>
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Fee</Trans>
            </Typography>

            <Typography color="text">$2.04</Typography>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography color="text">~ 2m 30s</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={4}>
            <Button onClick={() => setOpen(true)} disabled={!isBridgeButtonAvailable}>
              Bridge
            </Button>
          </Flex>
        </AutoColumn>
      </BrightPanel>

      <Modal isOpen={isOpen} onDismiss={controlledClose}>
        <ModalContentWrapper>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            {t`Bridge ${currencyAmountToBridge?.toFixed(2)} ${currencyToBridge?.symbol} from ${getNetworkDisplayName(
              bridgeDirection.from,
            )} to ${getNetworkDisplayName(bridgeDirection.to)}?`}
          </Typography>

          {bridgeDirection.from === 'archway' && archwayXcallFees && (
            <Typography textAlign="center">
              Includes a fee of {(Number(archwayXcallFees.rollback) / 10 ** 6).toPrecision(1)} Arch
            </Typography>
          )}

          <XCallEventManager xCallReset={xCallReset} msgs={msgs} />

          {/* Handle allowance */}
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
                    <Typography pb={4}>{t`Increase ${currencyAmountToBridge?.currency.symbol} allowance`}</Typography>
                    {isTxPending && <Spinner></Spinner>}
                    {!isTxPending && allowanceIncreaseNeeded && !allowanceIncreased && (
                      <Button onClick={increaseAllowance}>Increase allowance</Button>
                    )}
                  </Flex>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton
                  onClick={() => {
                    stopListening();
                    setXCallInProgress(false);
                    setOpen(false);
                  }}
                >
                  <Trans>Cancel</Trans>
                </TextButton>
                {allowanceIncreaseNeeded && !xCallInProgress ? (
                  <Button disabled={true}>Allowance needed</Button>
                ) : (
                  <StyledButton onClick={handleBridgeConfirm} disabled={xCallInProgress}>
                    {!xCallInProgress ? <Trans>Bridge</Trans> : <Trans>xCall in progress</Trans>}
                  </StyledButton>
                )}
              </>
            )}
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  );
}
