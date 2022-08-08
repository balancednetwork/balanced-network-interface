import React, { useCallback, useMemo } from 'react';

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
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from 'constants/index';
import { useActiveLocale } from 'hooks/useActiveLocale';
import useWidth from 'hooks/useWidth';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/collateral/actions';
import {
  useCollateralState,
  useCollateralActionHandlers,
  useIcxDisplayType,
  useCollateralType,
  useDepositedCollateral,
  useTotalCollateral,
  useSupportedCollateralTokens,
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

const CollateralPanel = () => {
  const { account } = useIconReact();
  const icxDisplayType = useIcxDisplayType();
  const ratio = useRatio();
  const locale = useActiveLocale();
  const collateralType = useCollateralType();
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();

  const isSuperSmall = useMedia(`(max-width: ${'es-ES,nl-NL,de-DE,pl-PL'.indexOf(locale) >= 0 ? '450px' : '359px'})`);

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

  const shouldDisplayICXValues = collateralType === 'sICX' && icxDisplayType === 'ICX';

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
      [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
    };
  }, [independentField, dependentField, typedValue, parsedAmount]);

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

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (shouldDeposit) {
      try {
        if (shouldDisplayICXValues) {
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
          const collateralTokenAddress = supportedCollateralTokens && supportedCollateralTokens[collateralType];
          const transferData = { _asset: '', _amount: 0 };
          const { result: hash } = await bnJs
            .inject({ account })
            .getContract(collateralTokenAddress!)
            .transfer(
              addresses[NETWORK_ID].loans,
              parseUnits(collateralDifference.toFixed()),
              JSON.stringify(transferData),
            );

          addTransaction(
            { hash },
            {
              pending: t`Depositing collateral...`,
              summary: t`Deposited ${collateralDifference.toFixed(2)} sICX as collateral.`,
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
          icxDisplayType === 'ICX'
            ? collateralDifference.div(ratio.sICXICXratio.isZero() ? 1 : ratio.sICXICXratio)
            : collateralDifference;

        const { result: hash } = await bnJs
          .inject({ account })
          .Loans.withdrawCollateral(parseUnits(collateralAmountInSICX.toFixed()), collateralType);

        addTransaction(
          { hash },
          {
            pending: t`Withdrawing collateral...`,
            summary: t`${collateralAmountInSICX.dp(2).toFormat()} ${collateralType} added to your wallet.`,
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

  // reset collateral ui state if cancel adjusting
  // change typedValue if sICX and ratio changes
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(collateralDeposit.isZero() ? '0' : collateralDeposit.toFixed(2));
    }
  }, [onFieldAInput, collateralDeposit, isAdjusting]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current.noUiSlider.set(afterAmount.toNumber());
    }
  }, [afterAmount, inputType]);

  // display locked sICX for borrowed bnUSD
  //TODOXX
  // const lockedICXAmount = useLockedICXAmount();
  // const lockedSICXAmount = useLockedSICXAmount();

  const lockedCollateral = useLockedCollateralAmount();

  const shouldShowLock = !lockedCollateral.isZero();

  // add one more ICX to the locked marker if user has debt to remove insufficient error.
  //TODOXX
  const tLockedAmount = React.useMemo(
    () => BigNumber.min(lockedCollateral.plus(shouldShowLock ? 1 : 0), collateralTotal),
    [lockedCollateral, collateralTotal, shouldShowLock],
  );

  const percent = collateralTotal.isZero() ? 0 : tLockedAmount.div(collateralTotal).times(100).toNumber();

  const hasEnoughICX = useHasEnoughICX();

  const [ref, width] = useWidth();

  return (
    <>
      <BoxPanelWrap>
        <BoxPanel bg="bg3" sx={{ position: 'relative' }}>
          <Flex justifyContent="space-between" alignItems={isSuperSmall ? 'flex-start' : 'center'} ref={ref}>
            <CollateralTypeSwitcherWrap>
              <Typography variant="h2" paddingRight={'7px'}>
                <Trans>Collateral</Trans>:
              </Typography>
              <CollateralTypeSwitcher width={width} containerRef={ref.current} />
            </CollateralTypeSwitcherWrap>

            <Flex flexDirection={isSuperSmall ? 'column' : 'row'} paddingTop={isSuperSmall ? '4px' : '0'}>
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
              padding={[Math.max(tLockedAmount.dp(2).toNumber(), 0), 0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [collateralTotal.isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : collateralTotal.dp(2).toNumber()],
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
                currency={shouldDisplayICXValues ? 'ICX' : collateralType}
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
                currency={shouldDisplayICXValues ? 'ICX' : collateralType}
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
            {shouldDeposit ? t`Deposit collateral?` : t`Withdraw collateral?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + (shouldDisplayICXValues ? ' ICX' : ` ${collateralType}`)}
          </Typography>

          {!shouldDeposit && shouldDisplayICXValues && (
            <Typography textAlign="center">{collateralDifference.dp(2).toFormat() + ' sICX'}</Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + (shouldDisplayICXValues ? ' ICX' : ` ${collateralType}`)}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + (shouldDisplayICXValues ? ' ICX' : ` ${collateralType}`)}
              </Typography>
            </Box>
          </Flex>

          {shouldDisplayICXValues && (
            <Typography textAlign="center">
              {shouldDeposit ? (
                <>
                  {t`Your ICX will be converted to sICX (Staked ICX).`}
                  <LineBreak />
                  {t`You’ll receive sICX when you withdraw, which you can unstake or swap for ICX on the Trade page.`}
                </>
              ) : (
                t`You'll receive sICX (Staked ICX). Unstake it from your wallet, or swap it for ICX on the Trade page.`
              )}
            </Typography>
          )}

          <Flex justifyContent="center" mt={shouldDisplayICXValues ? 4 : 0} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleCollateralConfirm} fontSize={14} disabled={!hasEnoughICX}>
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
