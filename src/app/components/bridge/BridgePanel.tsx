import React from 'react';

import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import {
  ICON_XCALL_NETWORK_ID,
  COSMOS_NATIVE_AVAILABLE_TOKENS,
  ARCHWAY_XCALL_NETWORK_ID,
  ARCHWAY_FEE_TOKEN_SYMBOL,
} from 'app/_xcall/_icon/config';
import { useIconXcallFee } from 'app/_xcall/_icon/eventHandlers';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import useAllowanceHandler from 'app/_xcall/archway/AllowanceHandler';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { useArchwayXcallFee } from 'app/_xcall/archway/eventHandler';
import { useARCH } from 'app/_xcall/archway/tokens';
import { getFeeParam, getXCallOriginEventDataFromArchway, isDenomAsset } from 'app/_xcall/archway/utils';
import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';
import { useXCallGasChecker } from 'app/_xcall/hooks';
import { CurrentXCallState, SupportedXCallChains, XCallEvent } from 'app/_xcall/types';
import { getCrossChainTokenBySymbol, getNetworkDisplayName } from 'app/_xcall/utils';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import { ReactComponent as FlipIcon } from 'assets/icons/horizontal-flip.svg';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useWalletModalToggle } from 'store/application/hooks';
import { useBridgeDirection, useSetBridgeDestination, useSetBridgeOrigin } from 'store/bridge/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import {
  useAddTransactionResult,
  useArchwayTransactionsState,
  useInitTransaction,
} from 'store/transactionsCrosschain/hooks';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import {
  useAddOriginEvent,
  useCurrentXCallState,
  useSetNotPristine,
  useSetXCallState,
  useWithdrawableNativeAmount,
} from 'store/xCall/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import AddressInputPanel from '../AddressInputPanel';
import { Button, TextButton } from '../Button';
import CrossChainConnectWallet from '../CrossChainWalletConnect';
import CurrencyLogo from '../CurrencyLogo';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import { CurrencySelectionType } from '../SearchModal/CurrencySearch';
import Spinner from '../Spinner';
import { AutoColumn } from '../trade/SwapPanel';
import { BrightPanel } from '../trade/utils';
import XCallEventManager from '../trade/XCallEventManager';
import { presenceVariants, StyledButton as XCallButton } from '../trade/XCallSwapModal';
import { IBCDescription } from '../XCallDescription';
import ChainSelector from './ChainSelector';

const StyledXCallButton = styled(XCallButton)`
  transition: all 0.2s ease;

  &.disabled {
    background: rgba(255, 255, 255, 0.15);
    pointer-events: none;
    cursor: not-allowed;
  }
`;

const WithdrawOption = styled.button<{ active: boolean }>`
  text-align: center;
  padding: 10px 20px;
  border-radius: 10px;
  border: 0;
  outline: none;
  cursor: pointer;
  margin: 15px 15px 0;
  transition: all 0.2s ease;

  ${({ theme }) => `color: ${theme.colors.text}`};
  ${({ theme, active }) => `background-color: ${active ? theme.colors.bg3 : 'transparent'}`};

  &:hover {
    ${({ theme }) => `background-color: ${theme.colors.bg3}`};
  }

  img {
    margin-bottom: 5px;
  }
`;

const ConnectWrap = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  top: 0;
  right: 0;
  padding-right: 15px;
`;

export default function BridgePanel() {
  const { account } = useIconReact();
  const { address: accountArch, signingClient } = useArchwayContext();
  const crossChainWallet = useCrossChainWalletBalances();
  const bridgeDirection = useBridgeDirection();
  const setBridgeOrigin = useSetBridgeOrigin();
  const setBridgeDestination = useSetBridgeDestination();
  const addTransaction = useTransactionAdder();
  const { data: gasChecker } = useXCallGasChecker(bridgeDirection.from, bridgeDirection.to);
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const [currencyToBridge, setCurrencyToBridge] = React.useState<Currency | undefined>();
  const [amountToBridge, setAmountToBridge] = React.useState<string>('');
  const [destinationAddress, setDestinationAddress] = React.useState<string>('');
  const [modalClosable, setModalClosable] = React.useState(true);
  const [xCallInProgress, setXCallInProgress] = React.useState(false);
  const ARCH = useARCH();
  const signedInWallets = useSignedInWallets();
  const addOriginEvent = useAddOriginEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { isTxPending } = useArchwayTransactionsState();
  const { data: archwayXcallFees } = useArchwayXcallFee();
  const { data: iconXcallFees } = useIconXcallFee();
  const [isOpen, setOpen] = React.useState(false);
  const [withdrawNative, setWithdrawNative] = React.useState<boolean | undefined>();
  const currentXCallState = useCurrentXCallState();
  const setCurrentXCallState = useSetXCallState();
  const setNotPristine = useSetNotPristine();
  const toggleWalletModal = useWalletModalToggle();
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();

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
    setWithdrawNative(undefined);
    setCurrencyToBridge(currency);
  };

  const [percentAmount, setPercentAmount] = React.useState<number | undefined>();

  const handleInputPercentSelect = (percent: number) => {
    setPercentAmount(percent);
  };

  function getPercentAmount(percent: number, balance: CurrencyAmount<Currency>) {
    return balance.multiply(new Fraction(percent, 100)).toFixed();
  }

  React.useEffect(() => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (percentAmount && currencyAmount) {
      setAmountToBridge(getPercentAmount(percentAmount, currencyAmount));
    }
  }, [bridgeDirection.from, crossChainWallet, currencyToBridge, percentAmount]);

  const currencyAmountToBridge = React.useMemo(() => {
    if (currencyToBridge && amountToBridge && !isNaN(parseFloat(amountToBridge))) {
      return CurrencyAmount.fromRawAmount(
        currencyToBridge.wrapped,
        new BigNumber(amountToBridge).times(10 ** currencyToBridge.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [amountToBridge, currencyToBridge]);
  const { data: withdrawableNativeAmount } = useWithdrawableNativeAmount(bridgeDirection.to, currencyAmountToBridge);

  const isDenom = currencyAmountToBridge && isDenomAsset(currencyAmountToBridge.currency);

  const parsedAmount = React.useMemo(() => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (currencyAmount && percentAmount) {
      return getPercentAmount(percentAmount, currencyAmount);
    } else {
      return amountToBridge || '';
    }
  }, [amountToBridge, bridgeDirection.from, crossChainWallet, currencyToBridge, percentAmount]);

  const { increaseAllowance, allowanceIncreased, isIncreaseNeeded: allowanceIncreaseNeeded } = useAllowanceHandler(
    (bridgeDirection.from === 'archway' && !isDenom && currencyToBridge?.wrapped.address) || '',
    `${currencyAmountToBridge ? currencyAmountToBridge.quotient : '0'}`,
  );

  const handleDestinationAddressInput = (value: string) => {
    setDestinationAddress(value);
  };

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(wallet => wallet.chain === bridgeDirection.to);
    if (destinationWallet) {
      setDestinationAddress(destinationWallet.address);
    } else {
      setDestinationAddress('');
    }
  }, [bridgeDirection.to, setDestinationAddress, signedInWallets]);

  React.useEffect(() => {
    return () => setNotPristine();
  }, [setNotPristine]);

  const openModal = React.useCallback(() => {
    setCurrentXCallState(CurrentXCallState.AWAKE);
    setOpen(true);
  }, [setCurrentXCallState]);

  const closeModal = React.useCallback(() => {
    setCurrentXCallState(CurrentXCallState.IDLE);
    setOpen(false);
    setXCallInProgress(false);
    setNotPristine();
  }, [setCurrentXCallState, setNotPristine]);

  const xCallReset = React.useCallback(() => {
    setModalClosable(true);
    closeModal();
    handleTypeInput('');
  }, [closeModal]);

  const controlledClose = React.useCallback(() => {
    if (modalClosable && !xCallInProgress) {
      xCallReset();
    }
  }, [modalClosable, xCallInProgress, xCallReset]);

  React.useEffect(() => {
    if (currentXCallState === CurrentXCallState.IDLE) {
      xCallReset();
    }
  }, [currentXCallState, xCallReset]);

  const isBridgeButtonAvailable = React.useMemo(() => {
    if (!signedInWallets.some(wallet => wallet.chain === bridgeDirection.to)) return false;
    if (destinationAddress === '') return false;

    return true;
  }, [bridgeDirection.to, destinationAddress, signedInWallets]);

  React.useEffect(() => {
    if (currencyAmountToBridge) {
      if (currencyAmountToBridge.equalTo(0)) {
        setErrorMessage(t`Enter amount`);
      } else {
        if (
          signedInWallets.some(
            wallet =>
              wallet.chain === bridgeDirection.from &&
              (!crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address] ||
                crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address]?.lessThan(
                  currencyAmountToBridge,
                )),
          )
        ) {
          setErrorMessage(t`Insufficient ${currencyAmountToBridge.currency.symbol}`);
        } else {
          setErrorMessage(undefined);
        }
      }
    } else {
      setErrorMessage(t`Enter amount`);
    }
  }, [bridgeDirection.from, crossChainWallet, currencyAmountToBridge, setErrorMessage, signedInWallets]);

  const selectedTokenWalletBalance = React.useMemo(() => {
    if (currencyToBridge) {
      return crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    }
  }, [bridgeDirection.from, crossChainWallet, currencyToBridge]);

  const isNativeVersionAvailable = COSMOS_NATIVE_AVAILABLE_TOKENS.some(
    token => token.address === currencyToBridge?.wrapped.address,
  );

  const descriptionAction = `Transfer ${currencyToBridge?.symbol}`;
  const descriptionAmount = `${currencyAmountToBridge?.toFixed(2)} ${currencyAmountToBridge?.currency.symbol}`;

  const handleICONTxResult = async (hash: string) => {
    const txResult = await fetchTxResult(hash);

    if (txResult?.status === 1 && txResult.eventLogs.length) {
      const callMessageSentEvent = txResult.eventLogs.find(event =>
        event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
      );

      if (callMessageSentEvent) {
        const originEventData = getXCallOriginEventDataFromICON(
          callMessageSentEvent,
          bridgeDirection.to,
          descriptionAction,
          descriptionAmount,
        );
        originEventData && addOriginEvent('icon', originEventData);
      }
    }
  };

  const handleBridgeConfirm = async () => {
    if (!currencyAmountToBridge) return;

    const messages = {
      pending: `Requesting cross-chain transfer...`,
      summary: `Cross-chain transfer requested.`,
    };
    if (bridgeDirection.from === 'icon' && account && iconXcallFees) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      if (bnJs.contractSettings.ledgerSettings.actived) {
        changeShouldLedgerSign(true);
      }
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${
        bridgeDirection.to === 'archway' ? `${ARCHWAY_XCALL_NETWORK_ID}/` : ''
      }${destinationAddress}`;

      if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
        const cx = bnJs.inject({ account }).getContract(tokenAddress);
        const { result: hash } = await cx.crossTransfer(
          destination,
          `${currencyAmountToBridge.quotient}`,
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
          .AssetManager[withdrawNative ? 'withdrawNativeTo' : 'withdrawTo'](
            `${currencyAmountToBridge.quotient}`,
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

      if (isDenom) {
        const msg = { deposit_denom: { denom: tokenAddress, to: destination, data: [] } };
        const assetToBridge = {
          denom: tokenAddress,
          amount: `${currencyAmountToBridge.quotient}`,
        };

        try {
          initTransaction('archway', `Requesting cross-chain transfer...`);
          setXCallInProgress(true);

          const res = await signingClient.execute(
            accountArch,
            ARCHWAY_CONTRACTS.assetManager,
            msg,
            getFeeParam(1200000),
            undefined,
            archwayXcallFees.rollback !== '0'
              ? [{ amount: archwayXcallFees.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL }, assetToBridge]
              : [assetToBridge],
          );

          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          addTransactionResult('archway', res, t`Cross-chain transfer requested.`);
          originEventData && addOriginEvent('archway', originEventData);
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Cross-chain transfer request failed');
          setXCallInProgress(false);
        }
      } else {
        if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
          const msg = {
            cross_transfer: {
              amount: `${currencyAmountToBridge.quotient}`,
              to: destination,
              data: [],
            },
          };

          try {
            initTransaction('archway', `Requesting cross-chain transfer...`);
            setXCallInProgress(true);
            const res = await signingClient.execute(
              accountArch,
              tokenAddress,
              msg,
              'auto',
              undefined,
              archwayXcallFees.rollback !== '0'
                ? [{ amount: archwayXcallFees.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL }]
                : undefined,
            );

            const originEventData = getXCallOriginEventDataFromArchway(
              res.events,
              descriptionAction,
              descriptionAmount,
            );
            addTransactionResult('archway', res, t`Cross-chain transfer requested.`);
            originEventData && addOriginEvent('archway', originEventData);
          } catch (e) {
            console.error(e);
            addTransactionResult('archway', null, 'Cross-chain transfer request failed');
            setXCallInProgress(false);
          }
        } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
          try {
            const msg = {
              deposit: {
                token_address: tokenAddress,
                amount: `${currencyAmountToBridge.quotient}`,
                to: destination,
                data: [],
              },
            };
            initTransaction('archway', `Requesting cross-chain transfer...`);
            setXCallInProgress(true);
            const res = await signingClient.execute(
              accountArch,
              ARCHWAY_CONTRACTS.assetManager,
              msg,
              getFeeParam(1200000),
              undefined,
              archwayXcallFees.rollback !== '0'
                ? [{ amount: archwayXcallFees.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL }]
                : undefined,
            );

            const originEventData = getXCallOriginEventDataFromArchway(
              res.events,
              descriptionAction,
              descriptionAmount,
            );
            addTransactionResult('archway', res, t`Cross-chain transfer requested.`);
            originEventData && addOriginEvent('archway', originEventData);
          } catch (e) {
            console.error(e);
            addTransactionResult('archway', null, 'Cross-chain transfer request failed');
            setXCallInProgress(false);
          }
        }
      }
    }
  };

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

  const handleModalOpen = () => {
    if (signedInWallets.some(wallet => wallet.chain === bridgeDirection.from)) {
      openModal();
    } else {
      toggleWalletModal();
    }
  };

  const handleSwitch = () => {
    const from = bridgeDirection.from;
    const to = bridgeDirection.to;
    const crossChainCurrency = getCrossChainTokenBySymbol(to, currencyToBridge?.symbol);
    handleSetOriginChain(to);
    handleSetDestinationChain(from);
    crossChainCurrency && handleInputSelect(crossChainCurrency);
  };

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Transfer</Trans>
          </Typography>
          <Flex width="100%" alignItems="center" justifyContent="space-between">
            <ChainSelector label="from" chain={bridgeDirection.from} setChain={handleSetOriginChain} />
            <Box sx={{ cursor: 'pointer', marginLeft: '-25px' }} onClick={handleSwitch}>
              <FlipIcon width={25} height={17} />
            </Box>
            <ChainSelector label="to" chain={bridgeDirection.to} setChain={handleSetDestinationChain} />
          </Flex>

          <Typography
            as="div"
            mb={-1}
            textAlign="right"
            hidden={
              (bridgeDirection.from === 'icon' && !account) || (bridgeDirection.from === 'archway' && !accountArch)
            }
          >
            <Trans>Wallet:</Trans>{' '}
            {`${
              selectedTokenWalletBalance?.toFixed(4, {
                groupSeparator: ',',
              }) ?? 0
            } 
                ${currencyToBridge?.symbol}`}
          </Typography>

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

          <Flex style={{ position: 'relative' }}>
            <AddressInputPanel
              value={destinationAddress}
              onUserInput={handleDestinationAddressInput}
              drivenOnly={true}
            />
            {!destinationAddress && !signedInWallets.find(wallet => wallet.chain === bridgeDirection.to)?.address && (
              <ConnectWrap>
                <CrossChainConnectWallet chain={bridgeDirection.to} />
              </ConnectWrap>
            )}
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Bridge</Trans>
            </Typography>

            <Typography color="text">
              IBC + xCall
              <QuestionWrapper style={{ marginLeft: '3px', transform: 'translateY(1px)' }}>
                <QuestionHelper width={300} text={<IBCDescription />}></QuestionHelper>
              </QuestionWrapper>
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Fee</Trans>
            </Typography>

            <Typography color="text">
              {bridgeDirection.from === 'icon' && iconXcallFees && (
                <>{(parseInt(iconXcallFees.rollback, 16) / 10 ** 18).toPrecision(3)} ICX</>
              )}
              {bridgeDirection.from === 'archway' && archwayXcallFees && (
                <>{(Number(archwayXcallFees.rollback) / 10 ** ARCH.decimals).toPrecision(3)} ARCH</>
              )}
            </Typography>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography color="text">~ 15s</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={4}>
            <Button onClick={handleModalOpen} disabled={!isBridgeButtonAvailable || !!errorMessage}>
              {errorMessage ? errorMessage : <Trans>Transfer</Trans>}
            </Button>
          </Flex>
        </AutoColumn>
      </BrightPanel>

      <Modal isOpen={isOpen} onDismiss={controlledClose}>
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

          {isNativeVersionAvailable && (
            <>
              <Typography textAlign="center" mb="2px" mt={3}>
                {`Choose what to do with your ${currencyToBridge?.symbol}:`}
              </Typography>
              <Flex justifyContent="space-around">
                <WithdrawOption
                  active={withdrawNative !== undefined && withdrawNative}
                  onClick={() => setWithdrawNative(true)}
                >
                  {currencyToBridge?.symbol === 'sARCH' && <CurrencyLogo currency={ARCH} />}
                  <Typography fontWeight="bold" mb={1}>
                    Unstake
                  </Typography>
                  <Typography>
                    {`${withdrawableNativeAmount?.amount.toFormat(2, { groupSeparator: ',', decimalSeparator: '.' })} ${
                      withdrawableNativeAmount?.symbol
                    }`}{' '}
                  </Typography>
                </WithdrawOption>

                <WithdrawOption
                  active={withdrawNative !== undefined && !withdrawNative}
                  onClick={() => setWithdrawNative(false)}
                >
                  <CurrencyLogo currency={currencyToBridge} />
                  <Typography fontWeight="bold" mb={1}>
                    Keep {currencyToBridge?.symbol}
                  </Typography>
                  <Typography>
                    {`${currencyAmountToBridge?.toFixed(2, { groupSeparator: ',', decimalSeparator: '.' })} ${
                      currencyAmountToBridge?.currency.symbol
                    }`}{' '}
                  </Typography>
                </WithdrawOption>
              </Flex>
            </>
          )}

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
                    className={isNativeVersionAvailable && withdrawNative === undefined ? 'disabled' : ''}
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
