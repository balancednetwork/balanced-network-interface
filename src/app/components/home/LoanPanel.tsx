import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel, FlexPanel, BoxPanelWrap } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useActiveLocale } from 'hooks/useActiveLocale';
import useInterval from 'hooks/useInterval';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useCollateralActionHandlers, useCollateralType } from 'store/collateral/hooks';
import { Field } from 'store/loan/actions';
import {
  useLoanBorrowedAmount,
  useLoanState,
  useLoanTotalBorrowableAmount,
  useLoanActionHandlers,
  useLoanUsedAmount,
  useLoanParameters,
  useBorrowableAmountWithReserve,
  useInterestRate,
} from 'store/loan/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent from '../ModalContent';
import { PanelInfoWrap, PanelInfoItem } from './CollateralPanel';

const LoanPanel = () => {
  const { account } = useIconReact();
  const collateralType = useCollateralType();
  const locale = useActiveLocale();
  const { data: interestRate } = useInterestRate(collateralType);

  const isSuperSmall = useMedia(`(max-width: ${'es-ES,nl-NL,de-DE,pl-PL'.indexOf(locale) >= 0 ? '450px' : '300px'})`);

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  // user interaction logic
  const { independentField, typedValue, isAdjusting, inputType } = useLoanState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const { onFieldAInput, onFieldBInput, onSlide, onAdjust: adjust } = useLoanActionHandlers();
  const { onAdjust: adjustCollateral } = useCollateralActionHandlers();

  const handleEnableAdjusting = () => {
    adjust(true);
    adjustCollateral(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
    changeShouldLedgerSign(false);
  };

  //
  const borrowedAmount = useLoanBorrowedAmount();
  const totalBorrowableAmount = useLoanTotalBorrowableAmount();
  const borrowableAmountWithReserve = useBorrowableAmountWithReserve();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: borrowableAmountWithReserve.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]:
      parsedAmount[dependentField].isZero() || parsedAmount[dependentField].isNegative()
        ? '0'
        : parsedAmount[dependentField].toFixed(2),
  };

  const buttonText = borrowedAmount.isZero() ? t`Borrow` : t`Adjust`;

  const currentValue = parseFloat(formattedAmounts[Field.LEFT]);

  const [isLessThanMinimum, setLessThanMinimum] = React.useState(false);
  useInterval(() => {
    if (currentValue > 0 && currentValue < 10 !== isLessThanMinimum) {
      setLessThanMinimum(currentValue > 0 && currentValue < 10);
    }
  }, 2000);

  // loan confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  //before
  const beforeAmount = borrowedAmount;
  //after
  const afterAmount = parsedAmount[Field.LEFT];
  //difference = after-before
  const differenceAmount = afterAmount.minus(beforeAmount);
  const roundedDisplayDiffAmount = afterAmount.minus(beforeAmount.dp(2));

  const { originationFee = 0 } = useLoanParameters() || {};
  //whether if repay or borrow
  const shouldBorrow = differenceAmount.isPositive();
  //borrow fee
  const fee = differenceAmount.times(originationFee);
  const addTransaction = useTransactionAdder();

  const handleLoanConfirm = () => {
    if (!account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (shouldBorrow) {
      bnJs
        .inject({ account })
        .Loans.borrow(parseUnits(differenceAmount.toFixed()), collateralType)
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Borrowing bnUSD...`,
              summary: t`Borrowed ${differenceAmount.dp(2).toFormat()} bnUSD.`,
            },
          );
          // close modal
          toggleOpen();
          // reset loan panel values
          adjust(false);
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    } else {
      const repayAmount = parsedAmount[Field.LEFT].isEqualTo(0) ? borrowedAmount : differenceAmount.abs();

      bnJs
        .inject({ account })
        .Loans.returnAsset('bnUSD', parseUnits(repayAmount.toFixed()), collateralType)
        .then(res => {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Repaying bnUSD...`,
              summary: t`Repaid ${repayAmount.dp(2).toFormat()} bnUSD.`,
            },
          );
          // close modal
          toggleOpen();
          // reset loan panel values
          adjust(false);
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

  // reset loan ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(borrowedAmount.isZero() ? '0' : borrowedAmount.toFixed(2));
    }
  }, [onFieldAInput, borrowedAmount, isAdjusting]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(afterAmount.toNumber());
    }
  }, [afterAmount, inputType]);

  const usedAmount = useLoanUsedAmount();
  const percent = borrowableAmountWithReserve.isZero()
    ? 0
    : usedAmount.div(borrowableAmountWithReserve).times(100).toNumber();

  const shouldShowLock = !usedAmount.isZero();

  const hasEnoughICX = useHasEnoughICX();

  if (totalBorrowableAmount.isZero() || totalBorrowableAmount.isNegative()) {
    return (
      <FlexPanel bg="bg3" flexDirection="column" minHeight={195}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">
            <Trans>Loan</Trans>
          </Typography>
        </Flex>

        <Flex flex={1} justifyContent="center" alignItems="center">
          <Typography>
            <Trans>To borrow bnUSD, deposit collateral.</Trans>
          </Typography>
        </Flex>
      </FlexPanel>
    );
  }

  return (
    <>
      <BoxPanelWrap>
        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">
              <Trans>Loan</Trans>
            </Typography>
            <Flex flexDirection={isSuperSmall ? 'column' : 'row'} paddingTop={isSuperSmall ? '4px' : '0'}>
              {isAdjusting ? (
                <>
                  <TextButton onClick={handleCancelAdjusting} marginBottom={isSuperSmall ? '10px' : '0'}>
                    <Trans>Cancel</Trans>
                  </TextButton>
                  <Button
                    disabled={
                      borrowedAmount.isLessThanOrEqualTo(0) ? currentValue >= 0 && currentValue < 10 : currentValue < 0
                    }
                    onClick={toggleOpen}
                    fontSize={14}
                  >
                    <Trans>Confirm</Trans>
                  </Button>
                </>
              ) : (
                <Button onClick={handleEnableAdjusting} fontSize={14}>
                  {buttonText}
                </Button>
              )}
            </Flex>
          </Flex>

          {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} text={t`Used`} />}

          <Box marginY={6}>
            <Nouislider
              disabled={!isAdjusting}
              id="slider-loan"
              start={[borrowedAmount.dp(2).toNumber()]}
              padding={[
                Math.max(Math.min(usedAmount.dp(2).toNumber(), borrowableAmountWithReserve.dp(2).toNumber()), 0),
                0,
              ]}
              connect={[true, false]}
              range={{
                min: [0],
                // https://github.com/balancednetwork/balanced-network-interface/issues/50
                max: [
                  isNaN(borrowableAmountWithReserve.dp(2).toNumber()) || borrowableAmountWithReserve.dp(2).isZero()
                    ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                    : borrowableAmountWithReserve.dp(2).toNumber(),
                ],
              }}
              instanceRef={instance => {
                if (instance) {
                  sliderInstance.current = instance;
                }
              }}
              onSlide={onSlide}
            />
          </Box>
          <PanelInfoWrap>
            <PanelInfoItem>
              {isAdjusting && borrowedAmount.isLessThanOrEqualTo(0) ? (
                <CurrencyField
                  editable={isAdjusting}
                  isActive
                  label="Borrowed"
                  tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                  noticeShow={isLessThanMinimum}
                  noticeText={'10 bnUSD minimum'}
                  value={formattedAmounts[Field.LEFT]}
                  currency={'bnUSD'}
                  onUserInput={onFieldAInput}
                />
              ) : (
                <CurrencyField
                  editable={isAdjusting}
                  isActive
                  label="Borrowed"
                  tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                  value={formattedAmounts[Field.LEFT]}
                  currency={'bnUSD'}
                  onUserInput={onFieldAInput}
                />
              )}
            </PanelInfoItem>

            <PanelInfoItem>
              <CurrencyField
                editable={isAdjusting}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={formattedAmounts[Field.RIGHT]}
                currency={'bnUSD'}
                onUserInput={onFieldBInput}
              />
            </PanelInfoItem>
          </PanelInfoWrap>
        </BoxPanel>
      </BoxPanelWrap>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            {shouldBorrow ? t`Borrow Balanced Dollars?` : t`Repay Balanced Dollars?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {roundedDisplayDiffAmount.dp(2).toFormat()} bnUSD
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>
          </Flex>

          {shouldBorrow && (
            <Typography textAlign="center">
              <Trans>Includes a fee of {fee.dp(2).toFormat()} bnUSD.</Trans>
            </Typography>
          )}

          {interestRate && interestRate.isGreaterThan(0) && shouldBorrow && (
            <Typography textAlign="center">
              <Trans>
                Your loan will increase at a rate of {`${interestRate.times(100).toFixed(2)}%`.replace('.00%', '%')} per
                year.
              </Trans>
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleLoanConfirm} fontSize={14}>
                  <Trans>{shouldBorrow ? t`Borrow` : t`Repay`}</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export const RebalancingInfo = () => {
  return (
    <RebalancingInfoWrap width="100%">
      <Typography mb={3}>
        <Trans>
          If bnUSD ever falls below $0.90, traders can use the smart contracts to redeem it for borrower collateral.
        </Trans>
      </Typography>
      <Typography mb={3}>
        <Trans>
          For every bnUSD they redeem, they'll receive $0.90 of collateral. The bnUSD is burned, and 0.995 bnUSD of
          borrower debt repaid.
        </Trans>
      </Typography>
      <Typography>
        <Trans>
          Each redemption is spread across a group of borrowers to minimise the impact. The smaller your loan, the less
          it will affect you.
        </Trans>
      </Typography>
    </RebalancingInfoWrap>
  );
};

const RebalancingInfoWrap = styled(Box)`
  color: '#D5D7DB';
  svg {
    height: auto;
    margin-bottom: 10px;
  }
`;

export default LoanPanel;
