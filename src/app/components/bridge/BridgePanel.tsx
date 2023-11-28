import React from 'react';

import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { ICON_XCALL_NETWORK_ID, COSMOS_NATIVE_AVAILABLE_TOKENS } from 'app/_xcall/_icon/config';
import { useIconXcallFee } from 'app/_xcall/_icon/eventHandlers';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import useAllowanceHandler from 'app/_xcall/archway/AllowanceHandler';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { ARCHWAY_CONTRACTS } from 'app/_xcall/archway/config';
import { useArchwayXcallFee } from 'app/_xcall/archway/eventHandler';
import { getXCallOriginEventDataFromArchway } from 'app/_xcall/archway/utils';
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
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { useAddOriginEvent, useWithdrawableNativeAmount } from 'store/xCall/hooks';
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
`;

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
  const signedInWallets = useSignedInWallets();
  const addOriginEvent = useAddOriginEvent();
  const initTransaction = useInitTransaction();
  const addTransactionResult = useAddTransactionResult();
  const { isTxPending } = useArchwayTransactionsState();
  const { data: archwayXcallFees } = useArchwayXcallFee();
  const { data: iconXcallFees } = useIconXcallFee();
  const [isOpen, setOpen] = React.useState(false);
  const [withdrawNative, setWithdrawNative] = React.useState(false);

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
    setWithdrawNative(false);
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
        new BigNumber(amountToBridge).times(10 ** currencyToBridge.wrapped.decimals).toFixed(),
      );
    }
    return undefined;
  }, [amountToBridge, currencyToBridge]);
  const { data: withdrawableNativeAmount } = useWithdrawableNativeAmount(bridgeDirection.to, currencyAmountToBridge);

  const parsedAmount = React.useMemo(() => {
    const currencyAmount = currencyToBridge && crossChainWallet[bridgeDirection.from][currencyToBridge.wrapped.address];
    if (currencyAmount && percentAmount) {
      return getPercentAmount(percentAmount, currencyAmount);
    } else {
      return amountToBridge || '';
    }
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
    setXCallInProgress(false);
    setModalClosable(true);
    setOpen(false);
  }, [setXCallInProgress, setModalClosable, setOpen]);

  const controlledClose = React.useCallback(() => {
    if (modalClosable && !xCallInProgress) {
      xCallReset();
    }
  }, [modalClosable, xCallInProgress, xCallReset]);

  const isBridgeButtonAvailable = React.useMemo(() => {
    if (!currencyAmountToBridge) return false;
    if (!signedInWallets.some(wallet => wallet.chain === bridgeDirection.from)) return false;
    if (!signedInWallets.some(wallet => wallet.chain === bridgeDirection.to)) return false;
    if (!currencyAmountToBridge?.greaterThan(0)) return false;
    if (
      !crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address] ||
      crossChainWallet[bridgeDirection.from][currencyAmountToBridge.currency.address].lessThan(currencyAmountToBridge)
    )
      return false;
    return true;
  }, [bridgeDirection.from, bridgeDirection.to, crossChainWallet, currencyAmountToBridge, signedInWallets]);

  const isNativeVersionAvailable = COSMOS_NATIVE_AVAILABLE_TOKENS.some(
    token => token.address === currencyToBridge?.wrapped.address,
  );

  const descriptionAction = `Transfer ${currencyToBridge?.symbol}`;
  const descriptionAmount = `${currencyAmountToBridge?.toFixed(2)} ${currencyAmountToBridge?.currency.symbol}`;

  const handleICONTxResult = async (hash: string) => {
    const txResult = await fetchTxResult(hash);
    console.log('xCall debug - ICON tx - ', txResult);
    if (txResult?.status === 1 && txResult.eventLogs.length) {
      const callMessageSentEvent = txResult.eventLogs.find(event =>
        event.indexed.includes(getICONEventSignature(XCallEvent.CallMessageSent)),
      );

      if (callMessageSentEvent) {
        console.log('xCall debug - CallMessageSent event detected', callMessageSentEvent);
        const originEventData = getXCallOriginEventDataFromICON(
          callMessageSentEvent,
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
          .AssetManager[withdrawNative ? 'withdrawNativeTo' : 'withdrawTo'](
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
          initTransaction('archway', `Requesting cross-chain transfer...`);
          setXCallInProgress(true);
          const res = await signingClient.execute(accountArch, tokenAddress, msg, 'auto', undefined, [
            { amount: archwayXcallFees.rollback, denom: NETWORK_ID === 1 ? 'aarch' : 'aconst' },
          ]);
          console.log('xCall debug - Archway bridge init tx:', res);
          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          addTransactionResult('archway', res, t`Cross-chain transfer requested.`);
          originEventData && addOriginEvent('archway', originEventData);
          handleTypeInput('');
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
              amount: currencyAmountToBridge.quotient.toString(),
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
            {
              amount: [{ amount: '1', denom: 'aconst' }],
              gas: '1200000',
            },
            undefined,
            [{ amount: archwayXcallFees.rollback, denom: NETWORK_ID === 1 ? 'aarch' : 'aconst' }],
          );
          console.log('xCall debug - Archway bridge init tx:', res);
          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          addTransactionResult('archway', res, t`Cross-chain transfer requested.`);
          originEventData && addOriginEvent('archway', originEventData);
          handleTypeInput('');
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Cross-chain transfer request failed');
          setXCallInProgress(false);
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

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Typography variant="h2">
            <Trans>Transfer</Trans>
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
              IBC + xCall
              <QuestionWrapper style={{ marginLeft: '3px', transform: 'translateY(1px)' }}>
                <QuestionHelper
                  width={300}
                  text={
                    <>
                      <Typography mb={3}>
                        <Trans>
                          <strong>IBC</strong> is an interoperability protocol that allows blockchains to connect and
                          communicate with each other, primarily within the Cosmos ecosystem.
                        </Trans>
                      </Typography>
                      <Typography>
                        <Trans>
                          <strong>xCall</strong> is a cross-chain messaging service that allows you to interact with
                          smart contracts on other blockchains. While made for ICON's BTP, any interoperability solution
                          can adopt it.
                        </Trans>
                      </Typography>
                    </>
                  }
                ></QuestionHelper>
              </QuestionWrapper>
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Fee</Trans>
            </Typography>

            <Typography color="text">
              {bridgeDirection.from === 'icon' && iconXcallFees && (
                <>{(parseInt(iconXcallFees.rollback, 16) / 10 ** 18).toPrecision(1)} ICX</>
              )}
              {bridgeDirection.from === 'archway' && archwayXcallFees && (
                <>{(Number(archwayXcallFees.rollback) / 10 ** 6).toPrecision(1)} ARCH</>
              )}
            </Typography>
          </Flex>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Transfer time</Trans>
            </Typography>

            <Typography color="text">~ 30s</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={4}>
            <Button onClick={() => setOpen(true)} disabled={!isBridgeButtonAvailable}>
              Transfer
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
                <Trans>Do you want to receive a native version of the token?</Trans>
              </Typography>
              <Flex justifyContent="space-around">
                <WithdrawOption active={withdrawNative} onClick={() => setWithdrawNative(true)}>
                  <Typography fontWeight="bold" mb={1}>
                    Unstake
                  </Typography>
                  <Typography>
                    {`${withdrawableNativeAmount?.amount.toFormat(2, { groupSeparator: ',', decimalSeparator: '.' })} ${
                      withdrawableNativeAmount?.symbol
                    }`}{' '}
                  </Typography>
                </WithdrawOption>

                <WithdrawOption active={!withdrawNative} onClick={() => setWithdrawNative(false)}>
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

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton
                  onClick={() => {
                    setXCallInProgress(false);
                    setOpen(false);
                  }}
                >
                  <Trans>Cancel</Trans>
                </TextButton>
                {allowanceIncreaseNeeded && !xCallInProgress ? (
                  <Button disabled>Transfer</Button>
                ) : (
                  <StyledButton onClick={handleBridgeConfirm} disabled={xCallInProgress}>
                    {!xCallInProgress ? <Trans>Transfer</Trans> : <Trans>xCall in progress</Trans>}
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
