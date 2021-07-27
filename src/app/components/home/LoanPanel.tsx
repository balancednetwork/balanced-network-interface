import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useCollateralActionHandlers } from 'store/collateral/hooks';
import { Field } from 'store/loan/actions';
import {
  useLoanBorrowedAmount,
  useLoanState,
  useLoanTotalBorrowableAmount,
  useLoanActionHandlers,
  useLoanUsedAmount,
} from 'store/loan/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Tooltip from '../Tooltip';

const LoanPanel = () => {
  const { account } = useIconReact();

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

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalBorrowableAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]:
      parsedAmount[dependentField].isZero() || parsedAmount[dependentField].isNegative()
        ? '0'
        : parsedAmount[dependentField].toFixed(2),
  };

  const buttonText = borrowedAmount.isZero() ? 'Borrow' : 'Adjust';

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
  const differenceAmount = afterAmount.minus(beforeAmount.toFixed(2));

  //whether if repay or borrow
  const shouldBorrow = differenceAmount.isPositive();
  //borrow fee
  const fee = differenceAmount.multipliedBy(1 / 100);
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
        .Loans.depositAndBorrow(ZERO, { asset: 'bnUSD', amount: BalancedJs.utils.toLoop(differenceAmount) })
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: 'Borrowing bnUSD...',
              summary: `Borrowed ${differenceAmount.dp(2).toFormat()} bnUSD.`,
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
      bnJs
        .inject({ account })
        .Loans.returnAsset('bnUSD', BalancedJs.utils.toLoop(differenceAmount).abs(), 1)
        .then(res => {
          addTransaction(
            { hash: res.result },
            {
              pending: 'Repaying bnUSD...',
              summary: `Repaid ${differenceAmount.abs().dp(2).toFormat()} bnUSD.`,
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

  const _totalBorrowableAmount = BigNumber.max(totalBorrowableAmount.times(0.99), borrowedAmount);
  const percent = _totalBorrowableAmount.isZero() ? 0 : usedAmount.div(_totalBorrowableAmount).times(100).toNumber();

  const shouldShowLock = !usedAmount.isZero();

  const hasEnoughICX = useHasEnoughICX();
  if (totalBorrowableAmount.isZero() || totalBorrowableAmount.isNegative()) {
    return (
      <FlexPanel bg="bg3" flexDirection="column">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">
            Loan:{' '}
            <Typography as="span" fontSize={18} fontWeight="normal">
              US Dollars
            </Typography>
          </Typography>
        </Flex>

        <Flex flex={1} justifyContent="center" alignItems="center">
          <Typography>To take out a loan, deposit collateral.</Typography>
        </Flex>
      </FlexPanel>
    );
  }

  const currentValue = parseFloat(formattedAmounts[Field.LEFT]);

  const isLessThanMinimum = currentValue > 0 && currentValue < 10;

  return (
    <>
      <BoxPanel bg="bg3">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">
            Loan:{' '}
            <Typography as="span" fontSize={18} fontWeight="normal">
              US Dollars
            </Typography>
          </Typography>

          <Box>
            {isAdjusting ? (
              <>
                <TextButton onClick={handleCancelAdjusting}>Cancel</TextButton>
                <Button
                  disabled={
                    borrowedAmount.isLessThanOrEqualTo(0) ? currentValue >= 0 && currentValue < 10 : currentValue < 0
                  }
                  onClick={toggleOpen}
                  fontSize={14}
                >
                  Confirm
                </Button>
              </>
            ) : (
              <Button onClick={handleEnableAdjusting} fontSize={14}>
                {buttonText}
              </Button>
            )}
          </Box>
        </Flex>

        {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} text="Used" />}

        <Box marginY={6}>
          <Nouislider
            disabled={!isAdjusting}
            id="slider-loan"
            start={[borrowedAmount.dp(2).toNumber()]}
            padding={[Math.max(Math.min(usedAmount.dp(2).toNumber(), _totalBorrowableAmount.dp(2).toNumber()), 0), 0]}
            connect={[true, false]}
            range={{
              min: [0],
              // https://github.com/balancednetwork/balanced-network-interface/issues/50
              max: [
                isNaN(_totalBorrowableAmount.dp(2).toNumber()) || _totalBorrowableAmount.dp(2).isZero()
                  ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                  : _totalBorrowableAmount.dp(2).toNumber(),
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

        <Flex justifyContent="space-between">
          <Box width={[1, 1 / 2]} mr={4}>
            {isAdjusting && borrowedAmount.isLessThanOrEqualTo(0) ? (
              <Tooltip
                containerStyle={{ width: 'auto' }}
                placement="bottom"
                text="10 bnUSD minimum"
                show={isLessThanMinimum}
              >
                <CurrencyField
                  editable={isAdjusting}
                  isActive
                  label="Borrowed"
                  tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                  value={formattedAmounts[Field.LEFT]}
                  currency={'bnUSD'}
                  onUserInput={onFieldAInput}
                />
              </Tooltip>
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
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              editable={isAdjusting}
              isActive={false}
              label="Available"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={formattedAmounts[Field.RIGHT]}
              currency={'bnUSD'}
              onUserInput={onFieldBInput}
            />
          </Box>
        </Flex>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldBorrow ? 'Borrow Balanced Dollars?' : 'Repay Balanced Dollars?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat()} bnUSD
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat()} bnUSD
              </Typography>
            </Box>
          </Flex>

          {shouldBorrow && <Typography textAlign="center">Includes a fee of {fee.dp(2).toFormat()} bnUSD.</Typography>}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleLoanConfirm} fontSize={14}>
                  {shouldBorrow ? 'Borrow' : 'Repay'}
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </>
  );
};

export default LoanPanel;
