import React, { useCallback, useMemo, useState } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
import { t, Trans } from '@lingui/macro';
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
import { ReactComponent as IconUnstakeSICX } from 'assets/icons/timer-color.svg';
import { ReactComponent as IconKeepSICX } from 'assets/icons/wallet-tick-color.svg';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import useWidth from 'hooks/useWidth';
import { useChangeShouldLedgerSign, useICXUnstakingTime, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/collateral/actions';
import {
  useCollateralState,
  useCollateralActionHandlers,
  useCollateralType,
  useDepositedCollateral,
  useTotalCollateral,
  useSupportedCollateralTokens,
  useIsHandlingICX,
  useCollateralDecimalPlaces,
} from 'store/collateral/hooks';
import { useLoanActionHandlers, useLockedCollateralAmount } from 'store/loan/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CollateralTypeSwitcher, { CollateralTypeSwitcherWrap } from '../CollateralTypeSwitcher';
import ICXDisplayTypeSwitcher from '../ICXDisplayTypeSwitcher';
import ModalContent from '../ModalContent';

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

const UnstakingOption = styled(Flex)<{ isActive: boolean }>`
  padding: 10px 20px;
  margin: 15px;
  transition: all ease 0.2s;
  border-radius: 10px;
  flex-flow: column;
  align-items: center;
  background: ${({ theme, isActive }) => (isActive ? theme.colors.bg3 : 'transparent')};
  min-height: 110px;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.bg3};
  }
`;

enum ICXWithdrawOptions {
  KEEPSICX = 'keep',
  UNSTAKE = 'unstake',
  EMPTY = '',
}

const CollateralPanel = () => {
  const { account } = useIconReact();
  const ratio = useRatio();
  const collateralType = useCollateralType();
  const isHandlingICX = useIsHandlingICX();
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
  const [ICXWithdrawOption, setICXWithdrawOption] = useState<ICXWithdrawOptions>(ICXWithdrawOptions.EMPTY);
  const collateralDecimalPlaces = useCollateralDecimalPlaces();
  const { data: icxUnstakingTime } = useICXUnstakingTime();

  const isSuperSmall = useMedia(`(max-width: 450px)`);

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

  const handleCancelAdjusting = useCallback(() => {
    adjust(false);
  }, [adjust]);

  const collateralDeposit = useDepositedCollateral();
  const collateralTotal = useTotalCollateral();

  //  calculate dependentField value
  const parsedAmount = useMemo(() => {
    return {
      [independentField]: new BigNumber(typedValue || '0'),
      [dependentField]: collateralTotal.minus(new BigNumber(typedValue || '0')),
    };
  }, [independentField, dependentField, typedValue, collateralTotal]);

  const formattedAmounts = useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmount[dependentField].isZero()
        ? '0'
        : parsedAmount[dependentField].toFixed(collateralDecimalPlaces),
    };
  }, [independentField, dependentField, typedValue, parsedAmount, collateralDecimalPlaces]);

  const buttonText = collateralDeposit.isZero() ? t`Deposit` : t`Adjust`;

  // collateral confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
    changeShouldLedgerSign(false);
  };

  const beforeAmount = collateralDeposit;
  const afterAmount = parsedAmount[Field.LEFT];
  const differenceAmount = afterAmount.minus(beforeAmount);
  const collateralDifference = differenceAmount.abs();
  const shouldDeposit = differenceAmount.isPositive();

  const addTransaction = useTransactionAdder();

  const handleCollateralConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    const collateralTokenAddress = supportedCollateralTokens && supportedCollateralTokens[collateralType];
    const cx = bnJs.inject({ account }).getContract(collateralTokenAddress!);
    const decimals: string = await cx.decimals();

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (shouldDeposit) {
      try {
        if (isHandlingICX) {
          const { result: hash } = await bnJs
            .inject({ account })
            .Loans.depositAndBorrow(parseUnits(collateralDifference.toFixed()));

          addTransaction(
            { hash },
            {
              pending: t`Depositing collateral...`,
              summary: t`Deposited ${collateralDifference.dp(2).toFormat()} ICX as collateral.`,
            },
          );
        } else {
          const transferData = { _asset: '', _amount: 0 };
          const { result: hash } = await cx.transfer(
            addresses[NETWORK_ID].loans,
            parseUnits(collateralDifference.toFixed(), Number(decimals)),
            JSON.stringify(transferData),
          );

          addTransaction(
            { hash },
            {
              pending: t`Depositing collateral...`,
              summary: t`Deposited ${collateralDifference.toFixed(
                collateralDecimalPlaces,
              )} ${collateralType} as collateral.`,
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
        if (isHandlingICX) {
          const collateralDifferenceInSICX = collateralDifference.div(
            ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio,
          );
          if (ICXWithdrawOption === ICXWithdrawOptions.UNSTAKE) {
            const { result: hash } = await bnJs
              .inject({ account })
              .Loans.withdrawAndUnstake(parseUnits(collateralDifferenceInSICX.toFixed()));

            addTransaction(
              { hash },
              {
                pending: t`Withdrawing collateral...`,
                summary: t`${collateralDifference.dp(2).toFormat()} ICX is unstaking.`,
              },
            );
          } else {
            const { result: hash } = await bnJs
              .inject({ account })
              .Loans.withdrawCollateral(parseUnits(collateralDifferenceInSICX.toFixed()), collateralType);

            addTransaction(
              { hash },
              {
                pending: t`Withdrawing collateral...`,
                summary: t`${collateralDifferenceInSICX
                  .dp(collateralDecimalPlaces)
                  .toFormat()} ${collateralType} added to your wallet.`,
              },
            );
          }
        } else {
          const { result: hash } = await bnJs
            .inject({ account })
            .Loans.withdrawCollateral(parseUnits(collateralDifference.toFixed(), Number(decimals)), collateralType);

          addTransaction(
            { hash },
            {
              pending: t`Withdrawing collateral...`,
              summary: t`${collateralDifference
                .dp(collateralDecimalPlaces)
                .toFormat()} ${collateralType} added to your wallet.`,
            },
          );
        }
        toggleOpen();
        adjust(false);
      } catch (error) {
        console.log('handleCollateralConfirm.shouldDeposit = ' + shouldDeposit, error);
      } finally {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
  };

  // reset collateral ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(collateralDeposit.isZero() ? '0' : collateralDeposit.toFixed(collateralDecimalPlaces));
    }
  }, [onFieldAInput, collateralDeposit, isAdjusting, collateralDecimalPlaces]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current.noUiSlider.set(afterAmount.toNumber());
    }
  }, [afterAmount, inputType]);

  React.useEffect(() => {
    sliderInstance.current.noUiSlider.updateOptions(
      {
        format: {
          to: (value: Number) => value.toFixed(collateralDecimalPlaces),
          from: (value: string) => Number(value),
        },
      },
      false,
    );
  }, [collateralDecimalPlaces]);

  const lockedCollateral = useLockedCollateralAmount();
  const shouldShowLock = !lockedCollateral.isZero();

  // add small amount of collateral to lock to avoid tx errors.
  const tLockedAmount = React.useMemo(
    () => BigNumber.min(lockedCollateral.times(shouldShowLock ? 1.005 : 1), collateralTotal),
    [lockedCollateral, collateralTotal, shouldShowLock],
  );

  const percent = collateralTotal.isZero() ? 0 : tLockedAmount.div(collateralTotal).times(100).toNumber();

  const hasEnoughICX = useHasEnoughICX();

  const [ref, width] = useWidth();

  return (
    <>
      <BoxPanelWrap>
        <BoxPanel bg="bg3" sx={{ position: 'relative' }}>
          <Flex
            flexWrap="wrap"
            alignItems={isSuperSmall ? 'flex-start' : 'center'}
            ref={ref}
            paddingBottom={isSuperSmall ? 2 : 0}
          >
            <CollateralTypeSwitcherWrap>
              <Typography variant="h2" paddingRight={'7px'}>
                <Trans>Collateral</Trans>:
              </Typography>
              <CollateralTypeSwitcher width={width} containerRef={ref.current} />
            </CollateralTypeSwitcherWrap>

            <Flex flexDirection={isSuperSmall ? 'column' : 'row'} ml="auto" paddingTop={isSuperSmall ? '4px' : '0'}>
              {isAdjusting ? (
                <>
                  <TextButton onClick={handleCancelAdjusting} marginBottom={isSuperSmall ? '10px' : '0'}>
                    <Trans>Cancel</Trans>
                  </TextButton>
                  <Button onClick={toggleOpen} fontSize={14}>
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

          {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} text={t`Locked`} />}

          <Box marginY={6}>
            <Nouislider
              id="slider-collateral"
              disabled={!isAdjusting}
              start={collateralDeposit.toNumber()}
              padding={[Math.max(tLockedAmount.dp(collateralDecimalPlaces).toNumber(), 0), 0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [
                  collateralTotal.isZero()
                    ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD
                    : collateralTotal.dp(collateralDecimalPlaces).toNumber(),
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
                decimalPlaces={collateralDecimalPlaces}
                currency={isHandlingICX ? 'ICX' : collateralType}
                maxValue={collateralTotal}
                onUserInput={onFieldAInput}
              />
            </PanelInfoItem>

            <PanelInfoItem>
              <CurrencyField
                editable={isAdjusting}
                isActive={false}
                label="Wallet"
                tooltipText={collateralType === 'sICX' && 'The amount of ICX available to deposit from your wallet.'}
                value={formattedAmounts[Field.RIGHT]}
                decimalPlaces={collateralDecimalPlaces}
                currency={isHandlingICX ? 'ICX' : collateralType}
                maxValue={collateralTotal}
                onUserInput={onFieldBInput}
              />
            </PanelInfoItem>
          </PanelInfoWrap>
        </BoxPanel>
        <ICXDisplayTypeSwitcher handleCancelAdjusting={handleCancelAdjusting} />
      </BoxPanelWrap>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            {shouldDeposit
              ? t`Deposit ${isHandlingICX ? 'ICX' : collateralType} collateral?`
              : t`Withdraw ${isHandlingICX ? 'ICX' : collateralType} collateral?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(collateralDecimalPlaces).toFormat() + (isHandlingICX ? ' ICX' : ` ${collateralType}`)}
          </Typography>

          {!shouldDeposit && isHandlingICX && (
            <Typography textAlign="center">
              {ratio.sICXICXratio && collateralDifference.dividedBy(ratio.sICXICXratio).dp(2).toFormat() + ' sICX'}
            </Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(collateralDecimalPlaces).toFormat() + (isHandlingICX ? ' ICX' : ` ${collateralType}`)}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(collateralDecimalPlaces).toFormat() + (isHandlingICX ? ' ICX' : ` ${collateralType}`)}
              </Typography>
            </Box>
          </Flex>

          {isHandlingICX && (
            <Typography textAlign="center">
              {shouldDeposit ? (
                <>
                  {t`Your ICX will be converted to sICX (Staked ICX).`}
                  <LineBreak />
                  {t`You’ll receive sICX when you withdraw, which you can unstake or swap for ICX on the Trade page.`}
                </>
              ) : (
                t`Your ICX is staked (sICX). Choose what to do with it:`
              )}
              {!shouldDeposit && (
                <>
                  <Flex justifyContent="space-around">
                    <UnstakingOption
                      isActive={ICXWithdrawOption === ICXWithdrawOptions.UNSTAKE}
                      onClick={() => setICXWithdrawOption(ICXWithdrawOptions.UNSTAKE)}
                    >
                      <IconUnstakeSICX width="50px" />
                      <Typography fontWeight="bold" mt="auto">
                        Unstake
                      </Typography>
                      <Typography>{`${ratio.sICXICXratio && differenceAmount.times(-1).toFormat(2)} ICX`}</Typography>
                    </UnstakingOption>
                    <UnstakingOption
                      isActive={ICXWithdrawOption === ICXWithdrawOptions.KEEPSICX}
                      onClick={() => setICXWithdrawOption(ICXWithdrawOptions.KEEPSICX)}
                    >
                      <IconKeepSICX width="50px" />
                      <Typography fontWeight="bold" mt="auto">
                        Keep sICX
                      </Typography>
                      <Typography>{`${
                        ratio.sICXICXratio && differenceAmount.dividedBy(ratio.sICXICXratio).times(-1).toFormat(2)
                      } sICX`}</Typography>
                    </UnstakingOption>
                  </Flex>

                  {ICXWithdrawOption === ICXWithdrawOptions.KEEPSICX && (
                    <Typography textAlign="center">
                      <Trans>Recieve sICX, which you can trade or unstake from the wallet section later.</Trans>
                    </Typography>
                  )}
                  {ICXWithdrawOption === ICXWithdrawOptions.UNSTAKE && (
                    <Typography textAlign="center">
                      {t`Takes up to ${
                        icxUnstakingTime ? icxUnstakingTime.toFixed(1) : '~7'
                      } days. When it's ready, you can claim your ICX from the wallet section.`}
                    </Typography>
                  )}
                </>
              )}
            </Typography>
          )}

          <Flex justifyContent="center" mt={isHandlingICX ? 4 : 0} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button
                  onClick={handleCollateralConfirm}
                  fontSize={14}
                  disabled={
                    !hasEnoughICX || (isHandlingICX && !shouldDeposit && ICXWithdrawOption === ICXWithdrawOptions.EMPTY)
                  }
                >
                  {shouldDeposit ? t`Deposit` : t`Withdraw`}
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
