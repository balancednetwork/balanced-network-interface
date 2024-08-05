import React from 'react';

import { TradeType, Currency, Percent, Token } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex, Box } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import { Typography } from '@/app/theme';
import bnJs from '@/bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useSwapSlippageTolerance } from '@/store/application/hooks';
import { Field } from '@/store/swap/reducer';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { formatBigNumber, shortenAddress, toDec } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';

import ModalContent from '@/app/components/ModalContent';
import Spinner from '@/app/components/Spinner';
import { swapMessage } from '@/app/pages/trade/supply/_components/utils';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useSwapState } from '@/store/swap/hooks';
import { SLIPPAGE_MODAL_WARNING_THRESHOLD } from '@/constants/misc';
import { getRlpEncodedSwapData } from '@/app/pages/trade/bridge/utils';

type SwapModalProps = {
  isOpen: boolean;
  onClose: (clearInputs?: boolean) => void;
  account: string | undefined;
  recipient: string | undefined;
  currencies: { [field in Field]?: Currency };
  executionTrade?: Trade<Currency, Currency, TradeType>;
};

const SwapModal = (props: SwapModalProps) => {
  const { isOpen, onClose, executionTrade, currencies, account, recipient } = props;
  const showWarning = executionTrade?.priceImpact.greaterThan(SLIPPAGE_MODAL_WARNING_THRESHOLD);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleDismiss = (clearInputs = true) => {
    if (shouldLedgerSign) return;

    changeShouldLedgerSign(false);
    onClose?.(clearInputs);
  };

  const addTransaction = useTransactionAdder();

  const slippageTolerance = useSwapSlippageTolerance();

  const handleSwapConfirm = async () => {
    if (!executionTrade || !account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const message = swapMessage(
      formatBigNumber(new BigNumber(executionTrade?.inputAmount?.toFixed() || 0), 'currency'),
      executionTrade.inputAmount.currency.symbol || 'IN',
      formatBigNumber(new BigNumber(executionTrade?.outputAmount?.toFixed() || 0), 'currency'),
      executionTrade.outputAmount.currency.symbol || 'OUT',
    );

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

    if (executionTrade.inputAmount.currency.symbol === 'ICX') {
      const rlpEncodedData = getRlpEncodedSwapData(executionTrade).toString('hex');

      bnJs
        .inject({ account })
        .Router.swapICXV2(toDec(executionTrade.inputAmount), rlpEncodedData, toDec(minReceived), recipient)
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: message.pendingMessage,
              summary: message.successMessage,
            },
          );
          handleDismiss();
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
          changeShouldLedgerSign(false);
        });
    } else {
      const token = executionTrade.inputAmount.currency as Token;
      const outputToken = executionTrade.outputAmount.currency as Token;

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', recipient, minReceived).toString('hex');

      bnJs
        .inject({ account })
        .getContract(token.address)
        .swapUsingRouteV2(toDec(executionTrade.inputAmount), rlpEncodedData)
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: message.pendingMessage,
              summary: message.successMessage,
            },
          );
          handleDismiss();
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
          changeShouldLedgerSign(false);
        });
    }
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <Modal isOpen={isOpen} onDismiss={() => handleDismiss(false)}>
      <ModalContent>
        <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
          <Trans>
            Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
          </Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center" color={showWarning ? 'alert' : 'text'}>
          <Trans>
            {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
              executionTrade?.executionPrice.quoteCurrency.symbol
            } 
          per ${executionTrade?.executionPrice.baseCurrency.symbol}`}
          </Trans>
        </Typography>

        <Flex my={5}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>Pay</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}
            </Typography>
            {account !== recipient && (
              <>
                <Typography textAlign="center">
                  <Trans>ICON</Trans>
                </Typography>
                <Typography textAlign="center">
                  <Trans>{account && shortenAddress(account, 5)}</Trans>
                </Typography>
              </>
            )}
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>Receive</Trans>
            </Typography>
            <Typography variant="p" textAlign="center" py="5px">
              {formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.OUTPUT]?.symbol}
            </Typography>
            {account !== recipient && (
              <>
                <Typography textAlign="center">
                  <Trans>ICON</Trans>
                </Typography>
                <Typography textAlign="center">
                  <Trans>{recipient && shortenAddress(recipient, 5)}</Trans>
                </Typography>
              </>
            )}
          </Box>
        </Flex>

        <Typography
          textAlign="center"
          hidden={currencies[Field.INPUT]?.symbol === 'ICX' && currencies[Field.OUTPUT]?.symbol === 'sICX'}
        >
          <Trans>
            Includes a fee of {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
            {currencies[Field.INPUT]?.symbol}.
          </Trans>
        </Typography>

        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          {shouldLedgerSign && <Spinner></Spinner>}
          {!shouldLedgerSign && (
            <>
              <TextButton onClick={() => handleDismiss(false)}>
                <Trans>Cancel</Trans>
              </TextButton>
              <Button onClick={handleSwapConfirm} disabled={!hasEnoughICX}>
                <Trans>Swap</Trans>
              </Button>
            </>
          )}
        </Flex>
      </ModalContent>
    </Modal>
  );
};

export default SwapModal;
