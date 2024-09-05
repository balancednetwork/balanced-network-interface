import React, { useCallback, useState } from 'react';

import Nouislider from '@/packages/nouislider-react';
import { addresses } from '@balancednetwork/balanced-js';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from '@/app/components/Button';
import CollateralTypeSwitcher, { CollateralTypeSwitcherWrap } from '@/app/components/CollateralTypeSwitcher';
import { LineBreak } from '@/app/components/Divider';
import { UnderlineText } from '@/app/components/DropdownText';
import { CurrencyField } from '@/app/components/Form';
import ICXDisplayTypeSwitcher from '@/app/components/ICXDisplayTypeSwitcher';
import LockBar from '@/app/components/LockBar';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { BoxPanel, BoxPanelWrap } from '@/app/components/Panel';
import { Typography } from '@/app/theme';
import IconUnstakeSICX from '@/assets/icons/timer-color.svg';
import IconKeepSICX from '@/assets/icons/wallet-tick-color.svg';
import { NETWORK_ID } from '@/constants/config';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD } from '@/constants/index';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import useWidth from '@/hooks/useWidth';
import { useIconReact } from '@/packages/icon-react';
import { useICXUnstakingTime } from '@/store/application/hooks';
import {
  useCollateralActionHandlers,
  useCollateralState,
  useDerivedCollateralInfo,
  useIsHandlingICX,
  useSupportedCollateralTokens,
} from '@/store/collateral/hooks';
import { Field } from '@/store/collateral/reducer';
import { useLoanActionHandlers, useLockedCollateralAmount } from '@/store/loan/hooks';
import { useRatio } from '@/store/ratio/hooks';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { parseUnits } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXConnect, useXService } from '@/xwagmi/hooks';
import bnJs from '@/xwagmi/xchains/icon/bnJs';
import CollateralChainSelector from './_components/CollateralChainSelector';
import XCollateralModal, { XCollateralAction } from './_components/xCollateralModal';

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

export const UnderPanel = styled(Flex)`
  position: static;
  padding: 32px 15px 12px;
  margin-top: -21px;
  background-color: ${({ theme }) => theme.colors.bg2};
  border-radius: 0 0 15px 15px;
  color: ${({ theme }) => theme.colors.text};

  svg {
    margin-top: 10px;
  }

  ${({ theme }) => theme.mediaWidth.up500`
    padding: 32px 25px 12px;
  `}

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 30px 35px 10px;
  `}
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
  const {
    account,
    sourceChain,
    collateralType,
    collateralDeposit,
    collateralTotal,
    parsedAmount,
    collateralDecimalPlaces,
    formattedAmounts,
    differenceAmount,
    xTokenAmount,
  } = useDerivedCollateralInfo();

  const { isAdjusting, inputType } = useCollateralState();
  const ratio = useRatio();
  const isHandlingICX = useIsHandlingICX();
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
  const [ICXWithdrawOption, setICXWithdrawOption] = useState<ICXWithdrawOptions>(ICXWithdrawOptions.EMPTY);
  const { data: icxUnstakingTime } = useICXUnstakingTime();
  const isSuperSmall = useMedia(`(max-width: 359px)`);

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  const { onFieldAInput, onFieldBInput, onSlide, onAdjust: adjust } = useCollateralActionHandlers();
  const { onAdjust: adjustLoan } = useLoanActionHandlers();

  const collateralDifference = differenceAmount.abs();
  const shouldDeposit = differenceAmount.isPositive();

  const [storedModalValues, setStoredModalValues] = useState<{
    amount: string;
    before: string;
    after: string;
    action: XCollateralAction;
  }>({
    amount: '',
    before: '',
    after: '',
    action: shouldDeposit ? XCollateralAction.DEPOSIT : XCollateralAction.WITHDRAW,
  });

  const handleEnableAdjusting = () => {
    adjust(true);
    adjustLoan(false);
  };

  const handleCancelAdjusting = useCallback(() => {
    adjust(false);
  }, [adjust]);

  const buttonText = collateralDeposit.isZero() ? t`Deposit` : t`Adjust`;

  // collateral confirm modal logic & value
  const [open, setOpen] = React.useState(false);

  const isCrossChain = !(sourceChain === '0x1.icon' || sourceChain === '0x2.icon');

  const toggleOpen = () => {
    if (isCrossChain) {
      setStoredModalValues({
        amount: `${differenceAmount.dp(collateralDecimalPlaces).toFormat()} ${collateralType}`,
        before: `${collateralDeposit.dp(collateralDecimalPlaces).toFormat()} ${collateralType}`,
        after: `${parsedAmount[Field.LEFT].dp(collateralDecimalPlaces).toFormat()} ${collateralType}`,
        action: shouldDeposit ? XCollateralAction.DEPOSIT : XCollateralAction.WITHDRAW,
      });
      modalActions.openModal(MODAL_ID.XCOLLATERAL_CONFIRM_MODAL);
    } else {
      setOpen(!open);
    }
  };

  const addTransaction = useTransactionAdder();

  const handleCollateralConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    const collateralTokenAddress = supportedCollateralTokens && supportedCollateralTokens[collateralType];
    const cx = bnJs.inject({ account }).getContract(collateralTokenAddress!);
    const decimals: string = await cx.decimals();

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
      sliderInstance.current?.noUiSlider.set(parsedAmount[Field.LEFT].toNumber());
    }
  }, [parsedAmount[Field.LEFT], inputType]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    sliderInstance.current?.noUiSlider.updateOptions(
      {
        format: {
          to: (value: number) => value.toFixed(collateralDecimalPlaces),
          from: (value: string) => Number(value),
        },
      },
      false,
    );
  }, [collateralDecimalPlaces, sliderInstance.current]);

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
  const [underPanelRef, underPanelWidth] = useWidth();

  const xChainType = getXChainType(sourceChain);
  const xService = useXService(xChainType);
  const xConnect = useXConnect();
  const handleConnect = () => {
    if (!xService) return;

    const xConnectors = xService.getXConnectors();
    if (xChainType === 'EVM') {
      modalActions.openModal(MODAL_ID.EVM_WALLET_OPTIONS_MODAL);
    } else if (xChainType === 'INJECTIVE') {
      modalActions.openModal(MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL);
    } else {
      xConnect(xConnectors[0]);
    }
  };

  return (
    <>
      <BoxPanelWrap>
        <BoxPanel bg="bg3" sx={{ position: 'relative' }} className="drop-shadow">
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

            {account && (
              <Flex flexDirection={isSuperSmall ? 'column' : 'row'} ml="auto" paddingTop={isSuperSmall ? '4px' : '0'}>
                {isAdjusting ? (
                  <>
                    <TextButton
                      onClick={handleCancelAdjusting}
                      marginBottom={isSuperSmall ? '10px' : '0'}
                      paddingLeft={isSuperSmall ? '25px' : '0 !important'}
                      paddingRight="17px !important"
                    >
                      <Trans>Cancel</Trans>
                    </TextButton>
                    <Button onClick={toggleOpen} fontSize={14}>
                      <Trans>Confirm</Trans>
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEnableAdjusting} fontSize={14} disabled={collateralTotal?.isEqualTo(0)}>
                    {buttonText}
                  </Button>
                )}
              </Flex>
            )}
          </Flex>

          {!account && (
            <Flex minHeight={140} alignItems="center" justifyContent="center">
              <Typography mr={1}>{t`To deposit ${collateralType}`},</Typography>
              <Typography color="primaryBright">
                <UnderlineText onClick={handleConnect}>
                  <Trans>sign in with</Trans>
                  {` ${xChainMap[sourceChain].name}`}
                </UnderlineText>
              </Typography>
              <Typography>.</Typography>
            </Flex>
          )}

          {account && (
            <>
              {shouldShowLock && <LockBar disabled={!isAdjusting} percent={percent} text={t`Locked`} />}

              <Box pt={7} pb={isAdjusting ? 5 : 6} style={{ transition: 'all ease 0.3s' }}>
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
                    tooltipText={
                      collateralType === 'sICX' && 'The amount of ICX available to deposit from your wallet.'
                    }
                    value={formattedAmounts[Field.RIGHT]}
                    decimalPlaces={collateralDecimalPlaces}
                    currency={isHandlingICX ? 'ICX' : collateralType}
                    maxValue={collateralTotal}
                    onUserInput={onFieldBInput}
                  />
                </PanelInfoItem>
              </PanelInfoWrap>
            </>
          )}
        </BoxPanel>
        <UnderPanel>
          <Flex width="100%" justifyContent="space-between" ref={underPanelRef}>
            <CollateralChainSelector width={underPanelWidth} containerRef={underPanelRef.current} />
            <ICXDisplayTypeSwitcher handleCancelAdjusting={handleCancelAdjusting} />
          </Flex>
        </UnderPanel>
      </BoxPanelWrap>

      <XCollateralModal
        account={account}
        currencyAmount={xTokenAmount}
        sourceChain={sourceChain}
        storedModalValues={storedModalValues}
      />

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
                {collateralDeposit.dp(collateralDecimalPlaces).toFormat() +
                  (isHandlingICX ? ' ICX' : ` ${collateralType}`)}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {parsedAmount[Field.LEFT].dp(collateralDecimalPlaces).toFormat() +
                  (isHandlingICX ? ' ICX' : ` ${collateralType}`)}
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
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CollateralPanel;
