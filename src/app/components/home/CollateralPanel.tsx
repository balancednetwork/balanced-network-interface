import React, { useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import { LineBreak } from 'app/components/Divider';
import { CurrencyField } from 'app/components/Form';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/collateral/actions';
import {
  useCollateralState,
  useCollateralDepositedAmountInICX,
  useCollateralDepositedAmount,
  useCollateralTotalICXAmount,
  useCollateralTotalSICXAmount,
  useCollateralActionHandlers,
  useIcxDisplayType,
  useCollateralChangeIcxDisplayType,
} from 'store/collateral/hooks';
import { useLockedICXAmount, useLockedSICXAmount, useLoanActionHandlers } from 'store/loan/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { IcxDisplayType } from 'types';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import { MouseoverTooltip } from '../Tooltip';

// Move to other file
const CollateralTypeUI = styled.div`
  position: absolute;
  transform: translateY(100%);
  bottom: 0;
  display: flex;
  padding-top: 5px;

  svg {
    margin-top: 10px;
  }
`;

const CollateralTypeButton = styled.div`
  border-radius: 100px;
  padding: 1px 12px;
  margin-right: 5px;
  color: #ffffff;
  font-size: 14px;
  background-color: #144a68;
  cursor: pointer;

  &.active {
    cursor: default;
    background-color: #2ca9b7;
  }
`;

const CollateralPanel = () => {
  const { account } = useIconReact();
  const icxDisplayType = useIcxDisplayType();
  const collateralChangeIcxDisplayType = useCollateralChangeIcxDisplayType();
  const [userChoseIcxDisplayType, setUserChoseIcxDisplayType] = useState<boolean>(false);
  const ratio = useRatio();

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

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
  const stakedICXAmount = useCollateralDepositedAmountInICX(); // collateral in ICX
  const totalICXAmount = useCollateralTotalICXAmount();

  const sICXAmount = useCollateralDepositedAmount(); // collateral in sICX
  const totalSICXAmount = useCollateralTotalSICXAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]:
      icxDisplayType === 'ICX'
        ? new BigNumber(typedValue || '0')
        : new BigNumber(typedValue || '0').div(ratio.sICXICXratio),
    [dependentField]:
      icxDisplayType === 'ICX'
        ? totalICXAmount.minus(new BigNumber(typedValue || '0'))
        : totalSICXAmount.minus(new BigNumber(typedValue || '0').div(ratio.sICXICXratio)),
  };

  const formattedAmounts = {
    [independentField]:
      icxDisplayType === 'ICX'
        ? typedValue
        : new BigNumber(typedValue || '0').div(ratio.sICXICXratio).toFixed(2).toString(),
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  const buttonText = stakedICXAmount.isZero() ? 'Deposit' : 'Adjust';

  // collateral confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
    changeShouldLedgerSign(false);
  };

  const smallSp = useMedia('(max-width: 360px)');

  //before
  const beforeAmount = icxDisplayType === 'ICX' ? stakedICXAmount : sICXAmount;
  //after
  const afterAmount = parsedAmount[Field.LEFT];
  //difference = after-before
  const differenceAmount = afterAmount.minus(beforeAmount);
  const differenceAmountInSICX = differenceAmount.div(ratio.sICXICXratio);
  //collateral amount
  const collateralAmount = differenceAmount.abs();
  //whether if deposit or withdraw
  const shouldDeposit = differenceAmount.isPositive();

  //
  const addTransaction = useTransactionAdder();

  const handleCollateralConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (shouldDeposit) {
      try {
        if (icxDisplayType === 'ICX') {
          const { result: hash } = await bnJs
            .inject({ account: account })
            .Loans.depositAndBorrow(BalancedJs.utils.toLoop(collateralAmount));

          addTransaction(
            { hash },
            {
              pending: 'Depositing collateral...',
              summary: `Deposited ${collateralAmount.dp(2).toFormat()} ICX as collateral.`,
            },
          );
        } else {
          const { result: hash } = await bnJs
            .inject({ account })
            .sICX.depositAndBorrow(BalancedJs.utils.toLoop(collateralAmount));

          addTransaction(
            { hash },
            {
              pending: `Depositing collateral...`,
              summary: `Deposited ${collateralAmount.dp(2).toFormat()} sICX as collateral.`,
            },
          );
        }

        // close modal
        toggleOpen();

        // reset collateral panel values
        adjust(false);
      } catch (error) {
        console.log('handleCollateralConfirm.shouldDeposit = ' + shouldDeposit, error);
      } finally {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    } else {
      try {
        const collateralAmountInSICX =
          icxDisplayType === 'ICX' ? collateralAmount.div(ratio.sICXICXratio) : collateralAmount;

        const { result: hash } = await bnJs
          .inject({ account: account })
          .Loans.withdrawCollateral(BalancedJs.utils.toLoop(collateralAmountInSICX));

        addTransaction(
          { hash },
          {
            pending: 'Withdrawing collateral...',
            summary: `${collateralAmountInSICX.dp(2).toFormat()} sICX added to your wallet.`,
          },
        );

        // close modal
        toggleOpen();

        // reset collateral panel values
        adjust(false);
      } catch (error) {
        console.log('handleCollateralConfirm.shouldDeposit = ' + shouldDeposit, error);
      } finally {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
  };

  const handleChangeIcxDisplayType = (type: IcxDisplayType) => {
    collateralChangeIcxDisplayType(type);
    handleCancelAdjusting();
    setUserChoseIcxDisplayType(true);
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

  // default icx display to 'ICX' instead of 'sICX' if deposited collateral equals zero
  React.useEffect(() => {
    if (!userChoseIcxDisplayType) {
      if (stakedICXAmount.isZero()) {
        collateralChangeIcxDisplayType('ICX');
      } else {
        collateralChangeIcxDisplayType('sICX');
      }
    }
  }, [stakedICXAmount, collateralChangeIcxDisplayType, userChoseIcxDisplayType]);

  // display locked sICX for borrowed bnUSD
  const lockedICXAmount = useLockedICXAmount();
  const lockedSICXAmount = useLockedSICXAmount();

  const shouldShowLock = !lockedICXAmount.isZero();

  // add one more ICX to the locked marker if user has debt to remove insufficient error.
  const tLockedICXAmount = React.useMemo(
    () => BigNumber.min(lockedICXAmount.plus(shouldShowLock ? 1 : 0), totalICXAmount),
    [lockedICXAmount, totalICXAmount, shouldShowLock],
  );

  const tLockedSICXAmount = React.useMemo(
    () => BigNumber.min(lockedSICXAmount.plus(shouldShowLock ? 1 : 0), totalSICXAmount),
    [lockedSICXAmount, totalSICXAmount, shouldShowLock],
  );

  const percent =
    icxDisplayType === 'ICX'
      ? totalICXAmount.isZero()
        ? 0
        : tLockedICXAmount.div(totalICXAmount).times(100).toNumber()
      : totalSICXAmount.isZero()
      ? 0
      : tLockedSICXAmount.div(totalSICXAmount).times(100).toNumber();

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <BoxPanel bg="bg3" sx={{ position: 'relative' }}>
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
            start={[icxDisplayType === 'ICX' ? stakedICXAmount.dp(2).toNumber() : sICXAmount.dp(2).toNumber()]}
            padding={
              icxDisplayType === 'ICX'
                ? [Math.max(tLockedICXAmount.dp(2).toNumber(), 0), 0]
                : [Math.max(tLockedSICXAmount.dp(2).toNumber(), 0), 0]
            }
            connect={[true, false]}
            range={{
              min: [0],
              max: [
                icxDisplayType === 'ICX'
                  ? totalICXAmount.isZero()
                    ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                    : totalICXAmount.dp(2).toNumber()
                  : totalSICXAmount.isZero()
                  ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                  : totalSICXAmount.dp(2).toNumber(),
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
            <CurrencyField
              editable={isAdjusting}
              isActive
              label="Deposited"
              tooltip={icxDisplayType === 'ICX'}
              tooltipWider={true}
              tooltipText={
                <>
                  Your collateral balance is <b>{sICXAmount.dp(2).toFormat()} sICX</b> (staked ICX). The ICX value of
                  your sICX is displayed, and will increase over time from staking rewards. You can't use it unless you
                  withdraw it.
                </>
              }
              value={formattedAmounts[Field.LEFT]}
              currency={icxDisplayType}
              maxValue={icxDisplayType === 'ICX' ? totalICXAmount : totalSICXAmount}
              onUserInput={onFieldAInput}
            />
          </Box>

          <Box width={[1, 1 / 2]} ml={4}>
            <CurrencyField
              editable={isAdjusting}
              isActive={false}
              label="Wallet"
              tooltipText="The amount of ICX available to deposit from your wallet."
              value={formattedAmounts[Field.RIGHT]}
              currency={icxDisplayType}
              maxValue={icxDisplayType === 'ICX' ? totalICXAmount : totalSICXAmount}
              onUserInput={onFieldBInput}
            />
          </Box>
        </Flex>
        <CollateralTypeUI>
          <CollateralTypeButton
            className={icxDisplayType === 'ICX' ? `active` : ''}
            onClick={() => handleChangeIcxDisplayType('ICX')}
          >
            {`ICX`}
          </CollateralTypeButton>
          <CollateralTypeButton
            className={icxDisplayType === 'sICX' ? `active` : ''}
            onClick={() => handleChangeIcxDisplayType('sICX')}
          >
            {`sICX`}
          </CollateralTypeButton>
          <MouseoverTooltip
            containerStyle={{ width: 330 }}
            text={
              <Box>
                <Typography>Explaining collateral switcher</Typography>
              </Box>
            }
            placement="top"
          >
            {!smallSp && <QuestionIcon width={14} color="text1" style={{ marginTop: 4, color: '#D5D7DB' }} />}
          </MouseoverTooltip>
        </CollateralTypeUI>
      </BoxPanel>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldDeposit ? 'Deposit collateral?' : 'Withdraw collateral?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + (icxDisplayType === 'ICX' ? ' ICX' : ' sICX')}
          </Typography>

          {!shouldDeposit && icxDisplayType === 'ICX' && (
            <Typography textAlign="center">{differenceAmountInSICX.dp(2).toFormat() + ' sICX'}</Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + (icxDisplayType === 'ICX' ? ' ICX' : ' sICX')}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + (icxDisplayType === 'ICX' ? ' ICX' : ' sICX')}
              </Typography>
            </Box>
          </Flex>

          {icxDisplayType === 'ICX' && (
            <Typography textAlign="center">
              {shouldDeposit ? (
                <>
                  {`Your ICX will be converted to sICX (Staked ICX).`}
                  <LineBreak />
                  {`You’ll receive sICX when you withdraw, which you can unstake or swap for ICX on the Trade page.`}
                </>
              ) : (
                "You'll receive sICX (staked ICX). Unstake it from your wallet, or swap it for ICX on the Trade page."
              )}
            </Typography>
          )}

          <Flex justifyContent="center" mt={icxDisplayType === 'ICX' ? 4 : 0} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button onClick={handleCollateralConfirm} fontSize={14} disabled={!hasEnoughICX}>
                  {shouldDeposit ? 'Deposit' : 'Withdraw'}
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

export default CollateralPanel;
