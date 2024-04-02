import React from 'react';

import { Trans, t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { COSMOS_NATIVE_AVAILABLE_TOKENS } from 'app/_xcall/_icon/config';
import useAllowanceHandler from 'app/_xcall/archway/AllowanceHandler';
import { useARCH } from 'app/_xcall/archway/tokens';
import { useXCallGasChecker } from 'app/_xcall/hooks';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import { useShouldLedgerSign } from 'store/application/hooks';
import { useBridgeDirection } from 'store/bridge/hooks';
import { useArchwayTransactionsState } from 'store/transactionsCrosschain/hooks';
import { useWithdrawableNativeAmount } from 'store/xCall/hooks';

import { Button, TextButton } from '../Button';
import CurrencyLogo from '../CurrencyLogo';
import Modal from '../Modal';
import { ModalContentWrapper } from '../ModalContent';
import Spinner from '../Spinner';
import XCallEventManager from '../trade/XCallEventManager';
import { presenceVariants, StyledButton as XCallButton } from '../trade/XCallSwapModal';

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

export default function BridgeTransferModal({
  isOpen,
  onDismiss,
  onConfirm,
  closeModal,
  xCallReset,
  currencyToBridge,
  amountToBridge,
  destinationAddress,
  xCallInProgress,
  currencyAmountToBridge,
  isDenom,
}) {
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
                    onClick={onConfirm}
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
