import React, { useState } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useWalletModalToggle } from 'store/application/hooks';
import { useMaxSwapSize, useFeeAmount } from 'store/stabilityFund/hooks';
import { useDerivedSwapInfo } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { Button, TextButton } from '../Button';
import { HorizontalDivider } from '../Divider';
import ModalContent from '../ModalContent';
import QuestionHelper from '../QuestionHelper';
import Spinner from '../Spinner';
import { swapMessage } from '../trade/utils';

interface StabilityFundProps {
  clearSwapInputOutput: () => void;
  setInput: (input: string) => void;
}

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

const FundCTA = styled.span`
  color: ${({ theme }) => theme.colors.primaryBright};
  border: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  transition: color ease 0.2s;
  margin-top: 5px;
  text-align: center;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SwapSizeNotice = styled.div`
  text-align: center;
  font-size: 14px;
  margin-top: 5px;

  ${FundCTA} {
    margin: 0;
    padding: 0;
    white-space: nowrap;
  }
`;

const StabilityFund = ({ clearSwapInputOutput, setInput }: StabilityFundProps) => {
  const { account } = useIconReact();
  const { trade } = useDerivedSwapInfo();
  const toggleWalletModal = useWalletModalToggle();
  const maxSwapSize = useMaxSwapSize();
  const feeAmount = useFeeAmount();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const [showFundSwapConfirm, setShowFundSwapConfirm] = useState<boolean>(false);
  const hasEnoughICX = useHasEnoughICX();
  const isSmall = useMedia('(max-width: 500px)');

  const sendAmount = trade?.inputAmount;
  const sendSymbol = trade?.inputAmount.currency.symbol;
  const receivedCurrency = trade?.outputAmount.currency;
  const isBnUSDGoingIn = sendSymbol === 'bnUSD';
  const hasFundEnoughBalance =
    sendAmount && maxSwapSize
      ? new BigNumber(sendAmount.toFixed()).isLessThanOrEqualTo(new BigNumber(maxSwapSize.toFixed()))
      : 'loading';

  const handleFundTransfer = () => {
    if (!account) return;

    const tokenToBeReceivedFromFund = isBnUSDGoingIn ? receivedCurrency?.wrapped.address || '' : undefined;
    const stabilityFundAddress = addresses[NETWORK_ID].stabilityfund;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (sendAmount && sendSymbol && receivedCurrency && feeAmount) {
      const message = swapMessage(
        new BigNumber(sendAmount?.toSignificant(2)).toFormat(2),
        sendSymbol,
        new BigNumber(sendAmount.subtract(feeAmount).toSignificant()).toFormat(2),
        receivedCurrency.symbol || 'OUT',
      );

      const contract = bnJs.inject({ account }).getContract(sendAmount.currency.wrapped.address);

      contract
        .transfer(stabilityFundAddress, toDec(sendAmount), tokenToBeReceivedFromFund)
        .then((res: any) => {
          setShowFundSwapConfirm(false);
          if (!isEmpty(res.result)) {
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

  const handleFundSwapConfirmDismiss = () => {
    if (shouldLedgerSign) return;

    setShowFundSwapConfirm(false);
    changeShouldLedgerSign(false);
  };

  return (
    <>
      <Wrapper>
        {hasFundEnoughBalance === 'loading' ? (
          <Box paddingTop={4}>
            <Spinner centered />
          </Box>
        ) : hasFundEnoughBalance && sendAmount && feeAmount ? (
          <>
            <HorizontalDivider text={t`Or`} />
            <FundCTA>
              <span onClick={() => (account ? setShowFundSwapConfirm(true) : toggleWalletModal())}>
                {t`Use the Stability Fund to swap ${`${new BigNumber(sendAmount.toSignificant()).toFormat(
                  2,
                )} ${sendSymbol}`} for ${`${new BigNumber(sendAmount.subtract(feeAmount).toSignificant()).toFormat(
                  2,
                )} ${receivedCurrency?.symbol}`}`}
              </span>

              <QuestionHelper
                text={t`The Stability Fund lets you mint or burn bnUSD 1:1 for approved stablecoins, minus a 0.5% fee.`}
                placement={isSmall ? 'auto' : 'right'}
              />
            </FundCTA>
          </>
        ) : (
          maxSwapSize && (
            <>
              <HorizontalDivider text={t`Or`} />
              <SwapSizeNotice>
                {t`Use the Stability Fund to swap a maximum of`}
                {` `}
                <FundCTA onClick={() => setInput(maxSwapSize.toFixed(2))}>
                  {`${new BigNumber(maxSwapSize.toFixed(2)).toFormat()} ${sendSymbol}`}
                </FundCTA>{' '}
                {t`for`} {`${receivedCurrency?.symbol}`}
                <QuestionHelper
                  text={t`The Stability Fund lets you mint or burn bnUSD 1:1 for approved stablecoins, minus a 0.5% fee.`}
                  placement={isSmall ? 'auto' : 'right'}
                />
              </SwapSizeNotice>
            </>
          )
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
                {new BigNumber(sendAmount?.toSignificant() || 0).toFormat(2)} {sendSymbol}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>Receive</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {feeAmount && sendAmount
                  ? new BigNumber(sendAmount.subtract(feeAmount).toSignificant() || 0).toFormat(2)
                  : '-'}{' '}
                {receivedCurrency?.symbol}
              </Typography>
            </Box>
          </Flex>
          <Typography textAlign="center">
            <Trans>
              Includes a fee of {feeAmount ? new BigNumber(feeAmount.toSignificant()).toFormat(2) : '-'}{' '}
              {receivedCurrency?.symbol}.
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
