import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST } from 'constants/currency';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useCollateralAdjust } from 'store/collateral/hooks';
import { Field } from 'store/loan/actions';
import {
  useLoanAdjust,
  useLoanBorrowedAmount,
  useLoanState,
  useLoanType,
  useLoanTotalBorrowableAmount,
  useLoanFetchTotalRepaid,
} from 'store/loan/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

const LoanPanel = () => {
  const { account } = useIconReact();
  const updateLoanTotalRepaid = useLoanFetchTotalRepaid();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  // user interaction logic
  const { independentField, typedValue, isAdjusting, inputType } = useLoanState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const type = useLoanType();

  const handleLeftAmountType = React.useCallback(
    (value: string) => {
      type({ independentField: Field.LEFT, typedValue: value, inputType: 'text' });
    },
    [type],
  );

  const handleRightAmountType = React.useCallback(
    (value: string) => {
      type({ independentField: Field.RIGHT, typedValue: value, inputType: 'text' });
    },
    [type],
  );

  const handleSlider = React.useCallback(
    (values: string[], handle: number) => {
      type({ typedValue: values[handle], inputType: 'slider' });
    },
    [type],
  );

  const adjust = useLoanAdjust();
  const adjustCollateral = useCollateralAdjust();

  const handleEnableAdjusting = () => {
    adjust(true);
    adjustCollateral(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
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
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  const buttonText = borrowedAmount.isZero() ? 'Borrow' : 'Adjust';

  // loan confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => setOpen(!open);

  //before
  const beforeAmount = borrowedAmount;
  //after
  const afterAmount = parsedAmount[Field.LEFT];
  //difference = after-before
  const differenceAmount = afterAmount.minus(beforeAmount);
  //whether if repay or borrow
  const shouldBorrow = differenceAmount.isPositive();
  //borrow fee
  const fee = differenceAmount.multipliedBy(1 / 100);
  const addTransaction = useTransactionAdder();

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const handleLoanConfirm = async () => {
    if (!account) return;

    if (shouldBorrow) {
      bnJs
        .eject({ account })
        .Loans.originateLoan('bnUSD', BalancedJs.utils.toLoop(differenceAmount), account)
        .then(res => {
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
        });
    } else {
      bnJs
        .eject({ account })
        .bnUSD.repayLoan(BalancedJs.utils.toLoop(differenceAmount).abs())
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
        });
    }
    await delay(15000);
    updateLoanTotalRepaid('day');
  };

  // reset loan ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      type({
        independentField: Field.LEFT,
        typedValue: borrowedAmount.isZero() ? '0' : borrowedAmount.toFixed(2),
      });
    }
  }, [type, borrowedAmount, isAdjusting]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(afterAmount.toNumber());
    }
  }, [afterAmount, inputType]);

  // Add Used indicator to the Loan section #73
  // https://github.com/balancednetwork/balanced-network-interface/issues/73
  const remainingBNUSDAmount = useWalletBalances()['bnUSD'];

  const usedBNUSDAmount = React.useMemo(() => {
    return BigNumber.max(borrowedAmount.minus(remainingBNUSDAmount as BigNumber), new BigNumber(0));
  }, [borrowedAmount, remainingBNUSDAmount]);

  const percent = totalBorrowableAmount.isZero() ? 0 : usedBNUSDAmount.div(totalBorrowableAmount).times(100).toNumber();

  const shouldShowLock = !usedBNUSDAmount.isZero();

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
                <Button onClick={toggleOpen} fontSize={14}>
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
            // don't refactor the below code
            // it solved the race condition issue that caused padding value exceeds the max range value
            // need to find a good approach in the future
            padding={[Math.max(Math.min(usedBNUSDAmount.toNumber(), totalBorrowableAmount.toNumber()), 0), 0]}
            connect={[true, false]}
            range={{
              min: [0],
              // https://github.com/balancednetwork/balanced-network-interface/issues/50
              max: [
                totalBorrowableAmount.isZero()
                  ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                  : totalBorrowableAmount.dp(2).toNumber(),
              ],
            }}
            instanceRef={instance => {
              if (instance && !sliderInstance.current) {
                sliderInstance.current = instance;
              }
            }}
            onSlide={handleSlider}
          />
        </Box>

        <Flex justifyContent="space-between">
          <Box width={[1, 1 / 2]} mr={4}>
            <CurrencyField
              editable={isAdjusting}
              isActive
              label="Borrowed"
              tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
              value={!account ? '-' : formattedAmounts[Field.LEFT]}
              currency={!account ? CURRENCY_LIST['empty'] : CURRENCY_LIST['bnusd']}
              onUserInput={handleLeftAmountType}
            />
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              editable={isAdjusting}
              isActive={false}
              label="Available"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={!account ? '-' : formattedAmounts[Field.RIGHT]}
              currency={!account ? CURRENCY_LIST['empty'] : CURRENCY_LIST['bnusd']}
              onUserInput={handleRightAmountType}
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
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button onClick={handleLoanConfirm} fontSize={14}>
              {shouldBorrow ? 'Borrow' : 'Repay'}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default LoanPanel;
