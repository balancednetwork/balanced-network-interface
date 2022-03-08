import React, { useState } from 'react';

import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import { LineBreak } from 'app/components/Divider';
import { CurrencyField } from 'app/components/Form';
import LockBar from 'app/components/LockBar';
import Modal from 'app/components/Modal';
import { BoxPanel, BoxPanelWrap } from 'app/components/Panel';
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
import { parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent from '../ModalContent';
import { MouseoverTooltip } from '../Tooltip';

export const PanelInfoWrap = styled(Flex)`
  justify-content: space-between;
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.up360`
    flex-wrap: nowrap;
    justify-content: space-between;
  `}
`;

export const PanelInfoItem = styled(Box)`
  width: 100%;
  margin-left: 0;
  padding-top: 10px;

  ${({ theme }) => theme.mediaWidth.up360`
    width: 50%;
    margin-left: 5px;
  `}

  ${({ theme }) => theme.mediaWidth.up500`
    margin-left: 20px;
    padding-top: 0;
  `}

  &:first-of-type {
    margin-right: 5px;
    margin-left: 0;
    margin-bottom: 20px;

    ${({ theme }) => theme.mediaWidth.up360`
      margin-bottom: 0;
    `}

    ${({ theme }) => theme.mediaWidth.up500`
      margin-right: 20px;
    `}
  }
`;

const CollateralTypeUI = styled.div`
  position: static;
  display: flex;
  padding: 35px 25px 15px;
  margin-top: -20px;
  background-color: ${({ theme }) => theme.colors.bg2};
  border-radius: 0 0 10px 10px;

  svg {
    margin-top: 10px;
  }

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 35px 35px 15px;
  `}
`;

const CollateralTypeButton = styled.div`
  border-radius: 100px;
  padding: 1px 12px;
  margin-right: 5px;
  color: #ffffff;
  font-size: 14px;
  background-color: #144a68;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:not(.active):hover {
    background-color: #087083;
  }

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
  const isSuperSmall = useMedia(`(max-width: 359px)`);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  // user interaction logic
  const { independentField, typedValue, isAdjusting, inputType } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  // const typedValueIcxDisplayDypeDependent = icxDisplayType === 'ICX' ?

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
        : new BigNumber(typedValue || '0').div(ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio),
    [dependentField]:
      icxDisplayType === 'ICX'
        ? totalICXAmount.minus(new BigNumber(typedValue || '0'))
        : totalSICXAmount.minus(
            new BigNumber(typedValue || '0').div(ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio),
          ),
  };

  const formattedAmounts = {
    [independentField]:
      icxDisplayType === 'ICX'
        ? typedValue
        : new BigNumber(typedValue || '0')
            .div(ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio)
            .toFixed(2)
            .toString(),
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
  const differenceAmountInSICX = differenceAmount.div(ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio);
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
        const { result: hash } = await bnJs
          .inject({ account })
          .Loans.depositAndBorrow(parseUnits(collateralAmount.toFixed()));

        addTransaction(
          { hash },
          {
            pending: 'Depositing collateral...',
            summary:
              icxDisplayType === 'ICX'
                ? `Deposited ${collateralAmount.dp(2).toFormat()} ICX as collateral.`
                : `Deposited ${collateralAmount.dp(2).toFormat()} sICX as collateral.`,
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
    } else {
      try {
        const collateralAmountInSICX =
          icxDisplayType === 'ICX'
            ? collateralAmount.div(ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio)
            : collateralAmount;

        const { result: hash } = await bnJs
          .inject({ account })
          .Loans.withdrawCollateral(parseUnits(collateralAmountInSICX.toFixed()));

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
      onFieldAInput(
        stakedICXAmount.isZero() ? '0' : icxDisplayType === 'ICX' ? stakedICXAmount.toFixed(2) : sICXAmount.toFixed(2),
      );
    }
  }, [onFieldAInput, stakedICXAmount, isAdjusting, sICXAmount, icxDisplayType]);

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
      <BoxPanelWrap>
        <BoxPanel bg="bg3" sx={{ position: 'relative' }}>
          <Flex justifyContent="space-between" alignItems={isSuperSmall ? 'flex-start' : 'center'}>
            <Typography variant="h2">Collateral</Typography>

            <Flex flexDirection={isSuperSmall ? 'column' : 'row'} paddingTop={isSuperSmall ? '4px' : '0'}>
              {isAdjusting ? (
                <>
                  <TextButton onClick={handleCancelAdjusting} marginBottom={isSuperSmall ? '10px' : '0'}>
                    Cancel
                  </TextButton>
                  <Button onClick={toggleOpen} fontSize={14}>
                    Confirm
                  </Button>
                </>
              ) : (
                <Button onClick={handleEnableAdjusting} fontSize={14}>
                  {buttonText}
                </Button>
              )}
            </Flex>
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

          <PanelInfoWrap>
            <PanelInfoItem>
              <CurrencyField
                editable={isAdjusting}
                isActive
                label="Deposited"
                tooltip={false}
                value={formattedAmounts[Field.LEFT]}
                currency={icxDisplayType}
                maxValue={icxDisplayType === 'ICX' ? totalICXAmount : totalSICXAmount}
                onUserInput={onFieldAInput}
              />
            </PanelInfoItem>

            <PanelInfoItem>
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
            </PanelInfoItem>
          </PanelInfoWrap>
        </BoxPanel>
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
            text={
              <Box>
                <Typography>
                  View and manage your collateral as ICX or sICX (Staked ICX).
                  <LineBreak />
                  The ICX/sICX Deposited value is the same. The Wallet value is your available balance for that asset.
                </Typography>
              </Box>
            }
            placement="top"
          >
            {!smallSp && <QuestionIcon width={14} color="text1" style={{ marginTop: 4, color: '#D5D7DB' }} />}
          </MouseoverTooltip>
        </CollateralTypeUI>
      </BoxPanelWrap>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
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
                "You'll receive sICX (Staked ICX). Unstake it from your wallet, or swap it for ICX on the Trade page."
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
        </ModalContent>
      </Modal>
    </>
  );
};

export default CollateralPanel;
