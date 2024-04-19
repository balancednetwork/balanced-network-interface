import React from 'react';

import { Trans, t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { COSMOS_NATIVE_AVAILABLE_TOKENS } from 'app/_xcall/_icon/config';
import useAllowanceHandler from 'app/_xcall/archway/AllowanceHandler';
import { useARCH } from 'app/_xcall/archway/tokens';
import { useXCallFee, useXCallGasChecker } from 'app/_xcall/hooks';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { archway } from 'app/_xcall/archway/config1';
import { Typography } from 'app/theme';
import { useShouldLedgerSign } from 'store/application/hooks';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from 'store/bridge/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useAddTransactionResult, useInitTransaction } from 'store/transactionsCrosschain/hooks';
import { useArchwayTransactionsState } from 'store/transactionsCrosschain/hooks';
import { useWithdrawableNativeAmount } from 'store/xCall/hooks';
import { useAddOriginEvent } from 'store/xCall/hooks';

import { useIconReact } from 'packages/icon-react';

import { ICON_XCALL_NETWORK_ID, ARCHWAY_XCALL_NETWORK_ID, ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';
import { fetchTxResult, getICONEventSignature, getXCallOriginEventDataFromICON } from 'app/_xcall/_icon/utils';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { getFeeParam, getXCallOriginEventDataFromArchway } from 'app/_xcall/archway/utils';
import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';
import { XCallEventType } from 'app/_xcall/types';
import bnJs from 'bnJs';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button, TextButton } from 'app/components/Button';
import CurrencyLogo from 'app/components/CurrencyLogo';
import Modal from 'app/components/Modal';
import { ModalContentWrapper } from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import XCallEventManager from 'app/components/trade/XCallEventManager';
import { presenceVariants, StyledButton as XCallButton } from 'app/components/trade/XCallSwapModal';
import { StdFee } from '@archwayhq/arch3.js';

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

export default function BridgeTransferConfirmModal({
  isOpen,
  onDismiss,
  closeModal,
  xCallReset,
  xCallInProgress,
  setXCallInProgress,
}) {
  const { currency: currencyToBridge, recipient: destinationAddress } = useBridgeState();
  const { isDenom, currencyAmountToBridge } = useDerivedBridgeInfo();

  const { account } = useIconReact();
  const { address: accountArch, signingClient } = useArchwayContext();

  const bridgeDirection = useBridgeDirection();

  const { data: gasChecker } = useXCallGasChecker(bridgeDirection.from, bridgeDirection.to);
  const shouldLedgerSign = useShouldLedgerSign();

  const ARCH = useARCH();
  const { isTxPending } = useArchwayTransactionsState();
  const [withdrawNative, setWithdrawNative] = React.useState<boolean | undefined>();

  const { data: withdrawableNativeAmount } = useWithdrawableNativeAmount(bridgeDirection.to, currencyAmountToBridge);

  const {
    increaseAllowance,
    allowanceIncreased,
    isIncreaseNeeded: allowanceIncreaseNeeded,
  } = useAllowanceHandler(
    (bridgeDirection.from === 'archway' && !isDenom && currencyToBridge?.wrapped.address) || '',
    `${currencyAmountToBridge ? currencyAmountToBridge.quotient : '0'}`,
  );

  const isNativeVersionAvailable = COSMOS_NATIVE_AVAILABLE_TOKENS.some(
    token => token.address === currencyToBridge?.wrapped.address,
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
    if (bridgeDirection.from === 'icon' && account && xCallFee) {
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
          xCallFee.rollback,
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
            xCallFee.rollback,
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
    } else if (bridgeDirection.from === 'archway' && accountArch && signingClient && xCallFee) {
      const tokenAddress = currencyAmountToBridge.currency.address;
      const destination = `${bridgeDirection.to === 'icon' ? `${ICON_XCALL_NETWORK_ID}/` : ''}${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        try {
          initTransaction('archway', `Requesting cross-chain transfer...`);
          setXCallInProgress(true);

          const res = await signingClient.execute(
            accountArch,
            contract,
            msg,
            fee,
            undefined,
            xCallFee.rollback !== '0'
              ? [
                  { amount: xCallFee.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL },
                  ...(assetToBridge ? [assetToBridge] : []),
                ]
              : assetToBridge
                ? [assetToBridge]
                : undefined,
          );

          const originEventData = getXCallOriginEventDataFromArchway(res.events, descriptionAction, descriptionAmount);
          addTransactionResult('archway', res, t`Cross-chain transfer requested.`);
          originEventData && addOriginEvent('archway', originEventData);
        } catch (e) {
          console.error(e);
          addTransactionResult('archway', null, 'Cross-chain transfer request failed');
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
        } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
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
