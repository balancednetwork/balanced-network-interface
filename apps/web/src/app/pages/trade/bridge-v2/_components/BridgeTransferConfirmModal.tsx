import React, { useEffect } from 'react';

import { defaultRegistryTypes as defaultStargateTypes, SigningStargateClient } from '@cosmjs/stargate';
import { decodeTxRaw, Registry } from '@cosmjs/proto-signing';
import { wasmTypes } from '@cosmjs/cosmwasm-stargate/build/modules';

import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import Modal from 'app/components/Modal';
import { ModalContentWrapper } from 'app/components/ModalContent';
import { StyledButton as XCallButton } from 'app/components/trade/XCallSwapModal';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, TextButton } from 'app/components/Button';
import Spinner from 'app/components/Spinner';
import CurrencyLogo from 'app/components/CurrencyLogo';

import { getNetworkDisplayName } from 'app/_xcall/utils';
import { useXCallFee, useXCallGasChecker } from 'app/_xcall/hooks';
import { useShouldLedgerSign } from 'store/application/hooks';

import {
  useBridgeTransferConfirmModalStore,
  bridgeTransferConfirmModalActions,
} from '../_zustand/useBridgeTransferConfirmModalStore';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useARCH } from 'app/_xcall/archway/tokens';
import BridgeTransferStatus from './BridgeTransferStatus';
import { useBridgeDirection, useBridgeState, useDerivedBridgeInfo } from 'store/bridge/hooks';

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

export function BridgeTransferConfirmModal() {
  const { modalOpen } = useBridgeTransferConfirmModalStore();

  const {
    isWithdrawNativeChecked,
    // derived
    shouldLedgerSign,
    isTransferring,
    isAllowanceIncreaseNeeded,
    isNativeVersionAvailable,
    withdrawableNativeAmount,
    //actions
    setIsWithdrawNativeChecked,
  } = {};

  const bridgeDirection = useBridgeDirection();
  const { currency: currencyToBridge, recipient, typedValue } = useBridgeState();
  const { currencyAmountToBridge } = useDerivedBridgeInfo();

  // const shouldLedgerSign = useShouldLedgerSign();
  const { client } = useArchwayContext();

  const { data: gasChecker } = useXCallGasChecker(bridgeDirection.from, bridgeDirection.to);
  const ARCH = useARCH();

  useEffect(() => {
    const foo = async () => {
      // const height = await client.getHeight();
      // console.log('height', height);
      // 4268760;
      // const block = await client.getBlock(4268760);
      // console.log('block', block);
      // // console.log(block.txs[0]);
      // const decoded = decodeTxRaw(block.txs[0]);
      // console.log('decoded', decoded);
      // //"archway19hzhgd90etqc3z2qswumq80ag2d8het38r0al0r4ulrly72t20psdrpna6"
      // // const msg = {
      // //   get_count: {},
      // // };
      // // const { count } = await client.queryContractSmart(contractAddress, msg);
      // const registry = new Registry([...defaultStargateTypes, ...wasmTypes]);
      // for (const message of decoded.body.messages) {
      //   const decodedMsg = registry.decode(message);
      //   console.log('originalMsg', message);
      //   console.log('decodedMsg', decoded);
      // }
      // const tx = await client.getTx('F4B6B5C0FA8A5E10C004466012CE67289ED46FE14A9E3758A2E415489BDEC608');
      // console.log('tx', tx);
      // const searchResults = await client.searchTx([{ key: 'tx.height', value: 4268760 }]);
      // console.log('searchResults', searchResults);
    };
    if (client) {
      foo();
    }
  }, [client]);

  //allowance/approve
  //isNativeVersionAvailable

  const handleDismiss = () => {
    bridgeTransferConfirmModalActions.closeModal();
  };

  const handleTransfer = () => {};

  return (
    <>
      <Modal isOpen={modalOpen} onDismiss={handleDismiss}>
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
            {recipient}
          </Typography>

          {isNativeVersionAvailable && (
            <>
              <Typography textAlign="center" mb="2px" mt={3}>
                {`Choose what to do with your ${currencyToBridge?.symbol}:`}
              </Typography>
              <Flex justifyContent="space-around">
                <WithdrawOption
                  active={isWithdrawNativeChecked !== undefined && isWithdrawNativeChecked}
                  onClick={() => setIsWithdrawNativeChecked(true)}
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
                  active={isWithdrawNativeChecked !== undefined && !isWithdrawNativeChecked}
                  onClick={() => setIsWithdrawNativeChecked(false)}
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

          <BridgeTransferStatus />

          {gasChecker && gasChecker.hasEnoughGas && (
            <AnimatePresence>
              {/* {!isTransferring && isAllowanceIncreaseNeeded && !allowanceIncreased && (
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
                      {!isTxPending && isAllowanceIncreaseNeeded && !allowanceIncreased && (
                        <Button onClick={increaseAllowance}>Approve</Button>
                      )}
                      {isTxPending && <Button disabled>Approving...</Button>}
                    </Flex>
                  </Box>
                </motion.div>
              )} */}
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
                <TextButton onClick={handleDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>

                {isAllowanceIncreaseNeeded && !isTransferring ? (
                  <Button disabled>Transfer</Button>
                ) : (
                  <StyledXCallButton
                    onClick={handleTransfer}
                    disabled={isTransferring}
                    className={isNativeVersionAvailable && isWithdrawNativeChecked === undefined ? 'disabled' : ''}
                  >
                    {!isTransferring ? <Trans>Transfer</Trans> : <Trans>xCall in progress</Trans>}
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
