import React, { useState } from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import addresses from 'packages/BalancedJs/addresses';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { useFeeOut, useFeeIn } from 'store/swap/stabilityFund';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { Fraction } from 'types/balanced-sdk-core';
import { toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button, TextButton } from '../Button';
import { HorizontalDivider } from '../Divider';
import ModalContent from '../ModalContent';
import QuestionHelper from '../QuestionHelper';
import Spinner from '../Spinner';
import { swapMessage } from '../trade/utils';

const NETWORK_ID = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

const Wrapper = styled.div`
  padding: 15px;
  font-size: 14px;
  width: 290px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-content: center;
`;

const FundButton = styled.button`
  color: ${({ theme }) => theme.colors.primaryBright};
  border: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  transition: color ease 0.2s;
  margin-top: 5px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const StabilityFund = ({ clearSwapInputOutput }: { clearSwapInputOutput: () => void }) => {
  const { account } = useIconReact();
  const { trade } = useDerivedSwapInfo();
  const feeOut = useFeeOut();
  const feeIn = useFeeIn();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const [showFundSwapConfirm, setShowFundSwapConfirm] = useState<boolean>(false);
  const hasEnoughICX = useHasEnoughICX();

  const sendAmount = trade?.inputAmount;
  const sendSymbol = trade?.inputAmount.currency.symbol;
  const receivedCurrency = trade?.outputAmount.currency;
  const isBnUSDGoingIn = sendSymbol === 'bnUSD';
  const fee = isBnUSDGoingIn ? feeOut : feeIn;

  const handleFundSwapConfirmDismiss = () => {
    if (shouldLedgerSign) return;

    setShowFundSwapConfirm(false);
    changeShouldLedgerSign(false);
  };

  const getFeeAmount = (): string => {
    if (!!sendAmount && !!fee) {
      return sendAmount.multiply(new Fraction(1, 1 / fee)).toSignificant();
    } else {
      return '';
    }
  };

  const getAmountReceived = (): string => {
    if (!!sendAmount && !!fee) {
      return sendAmount.subtract(sendAmount.multiply(new Fraction(1, 1 / fee))).toSignificant();
    } else {
      return '';
    }
  };

  const handleFundTransfer = () => {
    if (!account) return;

    const tokenToBeReceivedFromFund = isBnUSDGoingIn ? receivedCurrency?.wrapped.address || '' : undefined;
    const stabilityFundAddress = addresses[NETWORK_ID].stabilityfund;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (sendAmount && sendSymbol && receivedCurrency) {
      const message = swapMessage(
        sendAmount?.toFixed(2),
        sendSymbol,
        getAmountReceived(),
        receivedCurrency.symbol || 'IN',
      );

      const contract = bnJs.inject({ account }).getContract(sendAmount.currency.wrapped.address);

      contract
        .transfer(stabilityFundAddress, toDec(sendAmount), tokenToBeReceivedFromFund)
        .then((res: any) => {
          setShowFundSwapConfirm(false);
          if (!isEmpty(res.result)) {
            console.log(res.result);
            addTransaction(
              { hash: res.result },
              {
                pending: message.pendingMessage,
                summary: message.successMessage,
              },
            );
            clearSwapInputOutput();
          } else {
            console.error(res);
          }
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    }
  };

  return (
    <>
      <Wrapper>
        {sendAmount && receivedCurrency && fee ? (
          <>
            <HorizontalDivider text={t`Or`} />
            <FundButton onClick={() => setShowFundSwapConfirm(true)}>
              <Box>
                {t`Use the Stability Fund to swap ${`${sendAmount?.toSignificant()} ${sendSymbol}`} for ${`${getAmountReceived()} ${
                  receivedCurrency?.symbol
                }`}`}
                <QuestionHelper
                  text={t`The Stability Fund allows you to mint or burn bnUSD 1:1 for approved stablecoins.`}
                  placement={'right'}
                />
              </Box>
            </FundButton>
          </>
        ) : (
          <Box paddingTop={4}>
            <Spinner centered />
          </Box>
        )}
      </Wrapper>

      <Modal isOpen={showFundSwapConfirm} onDismiss={handleFundSwapConfirmDismiss}>
        <ModalContent>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {sendSymbol} for {receivedCurrency?.symbol}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {t`1 ${sendSymbol} per ${receivedCurrency?.symbol}`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Pay</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {new BigNumber(sendAmount?.toSignificant() || 0).toFormat()} {sendSymbol}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>Receive</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {new BigNumber(getAmountReceived()).toFormat()} {receivedCurrency?.symbol}
              </Typography>
            </Box>
          </Flex>
          <Typography textAlign="center">
            <Trans>
              Includes a fee of {new BigNumber(getFeeAmount()).toFormat()} {receivedCurrency?.symbol}.
            </Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleFundSwapConfirmDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleFundTransfer} disabled={!hasEnoughICX}>
                  <Trans>Swap</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StabilityFund;
