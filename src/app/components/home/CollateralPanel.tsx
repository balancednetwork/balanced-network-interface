import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { ledgerConfirmAlert } from 'packages/BalancedJs/ledger';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { CurrencyField } from 'app/components/Form';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST } from 'constants/currency';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { Field } from 'store/collateral/actions';
import {
  useCollateralState,
  useCollateralDepositedAmountInICX,
  useCollateralTotalICXAmount,
  useCollateralActionHandlers,
} from 'store/collateral/hooks';
import { useLockedICXAmount, useLoanActionHandlers } from 'store/loan/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';

const CollateralPanel = () => {
  const { account, ledgerAddressPoint } = useIconReact();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  // user interaction logic
  const { independentField, typedValue, isAdjusting, inputType } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const { onFieldAInput, onFieldBInput, onSlide, onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();

  const handleEnableAdjusting = () => {
    adjust(true);
    adjustLoan(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
  };

  //
  const stakedICXAmount = useCollateralDepositedAmountInICX();

  const totalICXAmount = useCollateralTotalICXAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  const buttonText = stakedICXAmount.isZero() ? 'Deposit' : 'Adjust';

  // collateral confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  //before
  const beforeAmount = stakedICXAmount;
  //after
  const afterAmount = parsedAmount[Field.LEFT];
  //difference = after-before
  const differenceAmount = afterAmount.minus(beforeAmount);
  const ratio = useRatio();
  const differenceAmountInSICX = differenceAmount.div(ratio.sICXICXratio);
  //collateral amount
  const collateralAmount = differenceAmount.abs();
  //whether if deposit or withdraw
  const shouldDeposit = differenceAmount.isPositive();

  //
  const addTransaction = useTransactionAdder();

  const handleCollateralConfirm = () => {
    if (ledgerAddressPoint >= 0) {
      if (!ledgerConfirmAlert('Click Ok and check your ledger device?')) {
        return;
      }
    }

    if (shouldDeposit) {
      bnJs
        .inject({ account: account })
        .Loans.depositAndBorrow(BalancedJs.utils.toLoop(collateralAmount))
        .then((res: any) => {
          addTransaction(
            { hash: res.result || res },
            {
              pending: 'Depositing collateral...',
              summary: `Deposited ${collateralAmount.dp(2).toFormat()} ICX as collateral.`,
            },
          );
          // close modal
          toggleOpen();
          // reset collateral panel values
          adjust(false);
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      const collateralAmountInSICX = collateralAmount.div(ratio.sICXICXratio);
      bnJs
        .inject({ account: account })
        .Loans.withdrawCollateral(BalancedJs.utils.toLoop(collateralAmountInSICX))
        .then((res: any) => {
          addTransaction(
            { hash: res.result || res }, //
            {
              pending: 'Withdrawing collateral...',
              summary: `${collateralAmountInSICX.dp(2).toFormat()} sICX added to your wallet.`,
            },
          );
          // close modal
          toggleOpen();
          // reset collateral panel values
          adjust(false);
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  // reset collateral ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(stakedICXAmount.isZero() ? '0' : stakedICXAmount.toFixed(2));
    }
  }, [onFieldAInput, stakedICXAmount, isAdjusting]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current.noUiSlider.set(afterAmount.toNumber());
    }
  }, [afterAmount, inputType]);

  // display locked sICX for borrowed bnUSD
  const lockedICXAmount = useLockedICXAmount();

  const shouldShowLock = !lockedICXAmount.isZero();

  // add one more ICX to the locked marker if user has debt to remove insufficient error.
  const tLockedICXAmount = React.useMemo(
    () => BigNumber.min(lockedICXAmount.plus(shouldShowLock ? 1 : 0), totalICXAmount),
    [lockedICXAmount, totalICXAmount, shouldShowLock],
  );

  const percent = totalICXAmount.isZero() ? 0 : tLockedICXAmount.div(totalICXAmount).times(100).toNumber();

  return (
    <>
      <BoxPanel bg="bg3">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h2">Collateral</Typography>

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

        {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} />}

        <Box marginY={6}>
          <Nouislider
            id="slider-collateral"
            disabled={!isAdjusting}
            start={[stakedICXAmount.dp(2).toNumber()]}
            padding={[Math.max(tLockedICXAmount.dp(2).toNumber(), 0), 0]}
            connect={[true, false]}
            range={{
              min: [0],
              // https://github.com/balancednetwork/balanced-network-interface/issues/50
              max: [totalICXAmount.isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : totalICXAmount.dp(2).toNumber()],
            }}
            instanceRef={instance => {
              if (instance && !sliderInstance.current) {
                sliderInstance.current = instance;
              }
            }}
            onSlide={onSlide}
          />
        </Box>

        <Flex justifyContent="space-between">
          <Box width={[1, 1 / 2]} mr={4}>
            <CurrencyField
              id="staked-icx-amount"
              editable={isAdjusting}
              isActive
              label="Deposited"
              tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
              value={!account ? '-' : formattedAmounts[Field.LEFT]}
              currency={!account ? CURRENCY_LIST['empty'] : CURRENCY_LIST['icx']}
              onUserInput={onFieldAInput}
            />
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              id="unstaked-icx-amount"
              editable={isAdjusting}
              isActive={false}
              label="Wallet"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={!account ? '-' : formattedAmounts[Field.RIGHT]}
              currency={!account ? CURRENCY_LIST['empty'] : CURRENCY_LIST['icx']}
              onUserInput={onFieldBInput}
            />
          </Box>
        </Flex>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldDeposit ? 'Deposit ICON collateral?' : 'Withdraw ICON collateral?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + ' ICX'}
          </Typography>

          {!shouldDeposit && (
            <Typography textAlign="center">{differenceAmountInSICX.dp(2).toFormat() + ' sICX'}</Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' ICX'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' ICX'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            {shouldDeposit
              ? 'Your ICX will be staked as sICX.'
              : "You'll receive sICX (staked ICX). Unstake it from your wallet, or swap it for ICX on the Trade page."}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Cancel
            </TextButton>
            <Button onClick={handleCollateralConfirm} fontSize={14}>
              {shouldDeposit ? 'Deposit' : 'Withdraw'}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default CollateralPanel;
