import React, { useMemo, useRef, useState } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
import { Fraction } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import Divider from 'app/components/Divider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import { MenuItem, MenuList } from 'app/components/Menu';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import {
  useBBalnAmount,
  useLockedBaln,
  useBBalnSliderState,
  useBBalnSliderActionHandlers,
  useLockedUntil,
  useHasLockExpired,
  useTotalSupply,
  useBBalnChangeSelectedPeriod,
  useSelectedPeriod,
  useDynamicBBalnAmount,
  useSources,
  useTimeRemaining,
  usePastMonthFeesDistributed,
} from 'store/bbaln/hooks';
import { usePowerLeft } from 'store/liveVoting/hooks';
import { useHasAnyKindOfRewards } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX, useSignedInWallets } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { getFormattedNumber } from 'utils/formatter';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { DropdownPopper } from '../../Popover';
import QuestionHelper, { QuestionWrapper } from '../../QuestionHelper';
import { MetaData } from '../PositionDetailPanel';
import { BalnPreviewInput, ButtonsWrap, SliderWrap, Threshold } from './styledComponents';
import { LockedPeriod } from './types';
import UnstakePrompt from './UnstakePrompt';
import {
  WEEK_IN_MS,
  lockingPeriods,
  formatDate,
  getClosestUnixWeekStart,
  getWeekOffsetTimestamp,
  comparePeriods,
} from './utils';

const StyledThreshold = styled(Threshold)`
  height: 20px;
  margin-top: -10px;
`;

export default function BBalnSlider({
  title,
  titleVariant = 'h3',
  showMaxRewardsNotice,
  lockupNotice,
  onActiveSlider,
  onDisabledSlider,
  sliderBg,
  sliderMargin,
  simple,
  showGlobalTooltip = false,
  setGlobalTooltip,
}: {
  title: string;
  lockupNotice?: string;
  titleVariant?: 'h4' | 'h3' | 'h2';
  showMaxRewardsNotice?: boolean;
  sliderBg?: string;
  sliderMargin?: string;
  simple?: boolean;
  showGlobalTooltip?: boolean;
  onActiveSlider?: () => void;
  onDisabledSlider?: () => void;
  setGlobalTooltip?: (value: boolean) => void;
}) {
  const { account } = useIconReact();
  const bBalnAmount = useBBalnAmount();
  const lockedBalnAmount = useLockedBaln();
  const lockedUntil = useLockedUntil();
  const timeRemaining = useTimeRemaining();
  const totalSupplyBBaln = useTotalSupply();
  const dynamicBBalnAmount = useDynamicBBalnAmount();
  const powerLeft = usePowerLeft();
  const sources = useSources();
  const { data: hasLockExpired } = useHasLockExpired();
  const { typedValue, isAdjusting, inputType } = useBBalnSliderState();
  const { onFieldAInput, onSlide, onAdjust: adjust } = useBBalnSliderActionHandlers();
  const changePeriod = useBBalnChangeSelectedPeriod();
  const selectedPeriod = useSelectedPeriod();
  const sliderInstance = React.useRef<any>(null);
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const shouldLedgerSign = useShouldLedgerSign();
  const [periodDropdownAnchor, setPeriodDropdownAnchor] = useState<HTMLElement | null>(null);
  const periodArrowRef = useRef(null);
  const balnDetails = useBALNDetails();
  const hasEnoughICX = useHasEnoughICX();
  const isSmallScreen = useMedia('(max-width: 540px)');
  const isSuperSmallScreen = useMedia('(max-width: 400px)');
  const isSuperExtraSmallScreen = useMedia('(max-width: 379px)');
  const addTransaction = useTransactionAdder();
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const signedInWallets = useSignedInWallets();
  const { data: pastMonthFees } = usePastMonthFeesDistributed();
  const hasAnyKindOfRewards = useHasAnyKindOfRewards();

  const balnBalanceAvailable = useMemo(
    () => (balnDetails && balnDetails['Available balance'] ? balnDetails['Available balance']! : new BigNumber(0)),
    [balnDetails],
  );

  const balnTotal = useMemo(() => {
    if (balnBalanceAvailable && lockedBalnAmount) {
      return balnBalanceAvailable.plus(new BigNumber(lockedBalnAmount.toFixed()));
    }
  }, [balnBalanceAvailable, lockedBalnAmount]);

  const stakedBalance = balnDetails && balnDetails['Staked balance'];

  const handleEnableAdjusting = () => {
    adjust(true);
    onActiveSlider && onActiveSlider();
  };

  const handleWithdraw = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    try {
      const { result: hash } = await bnJs.inject({ account }).BBALN.withdraw();

      addTransaction(
        { hash },
        {
          pending: t`Withdrawing BALN...`,
          summary: t`${lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })} BALN withdrawn.`,
        },
      );
    } catch (e) {
      console.error(e);
    } finally {
      changeShouldLedgerSign(false);
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    }
    handleCancelAdjusting();
    setWithdrawModalOpen(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
    setPeriodDropdownAnchor(null);
    changeShouldLedgerSign(false);
    onDisabledSlider && onDisabledSlider();
  };

  const handleBoostUpdate = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const lockTimestamp = selectedPeriod.weeks * WEEK_IN_MS + new Date().getTime();

    try {
      if (shouldBoost) {
        if (bBalnAmount && bBalnAmount.isGreaterThan(0)) {
          if (differenceBalnAmount.isEqualTo(0)) {
            const { result: hash } = await bnJs.inject({ account }).BBALN.increaseUnlockTime(lockTimestamp);

            addTransaction(
              { hash },
              {
                pending: t`Increasing lock duration...`,
                summary: t`Lock duration increased  until ${formatDate(
                  getClosestUnixWeekStart(getWeekOffsetTimestamp(selectedPeriod.weeks)),
                  true,
                )}.`,
              },
            );
          } else {
            const { result: hash } = await bnJs
              .inject({ account })
              .BALN.increaseAmount(
                addresses[NETWORK_ID].bbaln,
                parseUnits(differenceBalnAmount.toFixed()),
                isPeriodChanged ? lockTimestamp : 0,
              );

            addTransaction(
              { hash },
              {
                pending: t`Locking BALN...`,
                summary: t`${balnSliderAmount.toFormat()} BALN locked until ${formatDate(
                  getClosestUnixWeekStart(getWeekOffsetTimestamp(selectedPeriod.weeks)),
                  true,
                )}.`,
              },
            );
          }
        } else {
          const { result: hash } = await bnJs
            .inject({ account })
            .BALN.createLock(addresses[NETWORK_ID].bbaln, parseUnits(differenceBalnAmount.toFixed()), lockTimestamp);

          addTransaction(
            { hash },
            {
              pending: t`Locking BALN...`,
              summary: t`${balnSliderAmount.toFormat()} BALN locked until ${formatDate(
                getClosestUnixWeekStart(getWeekOffsetTimestamp(selectedPeriod.weeks)),
                true,
              )}.`,
            },
          );
        }
      } else {
        const { result: hash } = await bnJs.inject({ account }).BBALN.withdrawEarly();

        addTransaction(
          { hash },
          {
            pending: t`Unlocking BALN early...`,
            summary: t`Unlocked ${balnReturnedEarly && getFormattedNumber(balnReturnedEarly, 'number2')} BALN.`,
          },
        );
      }
      adjust(false);
    } catch (error) {
      console.error('creating lock: ', error);
    } finally {
      changeShouldLedgerSign(false);
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    }
    setConfirmationModalOpen(false);
  };

  const [confirmationModalOpen, setConfirmationModalOpen] = React.useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = React.useState(false);

  const toggleConfirmationModalOpen = () => {
    if (shouldLedgerSign) return;
    setConfirmationModalOpen(!confirmationModalOpen);
  };

  const toggleWithdrawModalOpen = () => {
    if (shouldLedgerSign) return;
    setWithdrawModalOpen(!withdrawModalOpen);
  };

  const balnSliderAmount = useMemo(() => new BigNumber(typedValue), [typedValue]);
  const buttonText = hasLockExpired
    ? lockedBalnAmount?.greaterThan(0)
      ? t`Withdraw BALN`
      : t`Lock up BALN`
    : bBalnAmount?.isZero()
    ? t`Lock up BALN`
    : balnBalanceAvailable.isLessThan(1)
    ? t`Withdraw`
    : t`Adjust`;
  const beforeBalnAmount = new BigNumber(lockedBalnAmount?.toFixed(0) || 0);
  const differenceBalnAmount = balnSliderAmount.minus(beforeBalnAmount || new BigNumber(0));
  const shouldBoost = differenceBalnAmount.isPositive();
  const shouldNotifyOfVotingPower = useMemo(
    () => shouldBoost && lockedBalnAmount && lockedBalnAmount.greaterThan(0) && powerLeft?.lessThan(new Fraction(1)),
    [shouldBoost, lockedBalnAmount, powerLeft],
  );

  const samePeriod: LockedPeriod | undefined = useMemo(() => {
    return timeRemaining
      ? {
          name: t`Current unlock date`,
          weeks: Math.ceil(timeRemaining / WEEK_IN_MS),
        }
      : undefined;
  }, [timeRemaining]);

  const isPeriodChanged = useMemo(() => {
    const lockTimestamp = getWeekOffsetTimestamp(selectedPeriod.weeks);
    return getClosestUnixWeekStart(lockTimestamp).getTime() !== lockedUntil?.getTime();
  }, [lockedUntil, selectedPeriod]);

  const availablePeriods = useMemo(() => {
    if (lockedUntil && lockedUntil > new Date()) {
      const availablePeriods = lockingPeriods.filter(period => {
        return lockedUntil ? lockedUntil < new Date(new Date().setDate(new Date().getDate() + period.weeks * 7)) : true;
      });
      return samePeriod
        ? [samePeriod, ...(availablePeriods.length ? availablePeriods : [lockingPeriods[lockingPeriods.length - 1]])]
        : availablePeriods.length
        ? availablePeriods
        : [lockingPeriods[lockingPeriods.length - 1]];
    } else {
      return lockingPeriods;
    }
  }, [lockedUntil, samePeriod]);

  // reset ui state if cancel adjusting or locked Baln change
  React.useEffect(() => {
    if (!isAdjusting) {
      onFieldAInput(
        lockedBalnAmount !== undefined ? (lockedBalnAmount.greaterThan(0) ? lockedBalnAmount?.toFixed(0) : '0') : '0',
      );
      changePeriod(availablePeriods[0]);
    }
  }, [onFieldAInput, lockedBalnAmount, isAdjusting, availablePeriods, changePeriod]);

  React.useEffect(() => {
    if (isAdjusting) {
      setGlobalTooltip && setGlobalTooltip(true);
    } else {
      setGlobalTooltip && setGlobalTooltip(false);
    }
  }, [isAdjusting, setGlobalTooltip]);

  // optimize slider performance
  // change slider value if only a user types
  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current?.noUiSlider.set(balnSliderAmount.toNumber());
    }
  }, [balnSliderAmount, inputType]);

  const shouldShowLock = lockedBalnAmount && lockedBalnAmount.greaterThan(0);
  const lockbarPercentPosition =
    lockedBalnAmount && balnTotal ? new BigNumber(lockedBalnAmount.toFixed(0)).times(100).div(balnTotal).toNumber() : 0;

  const handleLockingPeriodChange = period => {
    changePeriod(period);
  };

  const handlePeriodDropdownToggle = (e: React.MouseEvent<HTMLElement>) => {
    setPeriodDropdownAnchor(periodDropdownAnchor ? null : periodArrowRef.current);
  };

  const closeDropdown = () => {
    setPeriodDropdownAnchor(null);
  };

  const handleBBalnInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = event.target.value;
    const value = new BigNumber(parseInt(userInput));

    if (balnTotal) {
      if (userInput === '' || value.isLessThan(0)) {
        onFieldAInput('0');
      } else if (value.isGreaterThan(balnTotal)) {
        onFieldAInput(balnTotal.dp(0, BigNumber.ROUND_DOWN).toFixed(0));
      } else if (!value.isNaN()) {
        onFieldAInput(value.toFixed(0));
      }
    }
  };

  const maxRewardThreshold = useMemo(() => {
    if (sources && totalSupplyBBaln && bBalnAmount) {
      return BigNumber.max(
        ...Object.values(sources).map(source =>
          source.supply.isGreaterThan(0)
            ? source.balance
                .times(totalSupplyBBaln)
                .minus(bBalnAmount.times(source.supply))
                .dividedBy(source.supply.minus(source.balance))
            : new BigNumber(0),
        ),
      );
    } else {
      return new BigNumber(0);
    }
  }, [sources, totalSupplyBBaln, bBalnAmount]);

  const maxRewardNoticeContent = dynamicBBalnAmount.isLessThan(bBalnAmount?.plus(maxRewardThreshold)) ? (
    <>
      {t`You need`}{' '}
      <strong>
        {bBalnAmount
          ?.plus(maxRewardThreshold)
          .toFormat(bBalnAmount.plus(maxRewardThreshold).isGreaterThan(100) ? 0 : 2)}{' '}
        bBALN
      </strong>{' '}
      {t`for 100% earning power.`}
    </>
  ) : (
    t`You receive maximum rewards for your position.`
  );

  const EarningPowerTooltipContent = () => (
    <>
      {(!bBalnAmount.isGreaterThan(0) || !account) && (
        <Typography color="text1" mb={account ? 3 : 0}>
          <Trans>
            Lock up BALN to hold bBALN, which earns network fees and boosts your BALN incentives for loans and liquidity
            pools.
          </Trans>
        </Typography>
      )}
      {account && hasAnyKindOfRewards && (
        <Typography color="text1">
          <Trans>
            Your earning potential depends on your bBALN holdings and position size compared to everyone else's.
          </Trans>
        </Typography>
      )}
      {(!hasAnyKindOfRewards || !account) && (
        <Typography mt={3}>
          {t`bBALN holders received`}{' '}
          <strong style={{ color: '#FFFFFF' }}>${pastMonthFees?.total.toFormat(0) ?? '-'} </strong>
          {t`from network fees in the last 30 days.`}
        </Typography>
      )}
    </>
  );

  const numberOfPositions = React.useMemo(
    () => (sources ? Object.values(sources).filter(source => source.balance.isGreaterThan(100)).length : 0),
    [sources],
  );

  const balnReturnedEarly = useMemo(() => {
    if (lockedBalnAmount && bBalnAmount) {
      return Math.max(
        new BigNumber(lockedBalnAmount.toFixed(0)).minus(bBalnAmount).toNumber(),
        new BigNumber(lockedBalnAmount.toFixed(0)).div(2).toNumber(),
      );
    }
  }, [lockedBalnAmount, bBalnAmount]);

  const earlyWithdrawPenalty = useMemo(() => {
    if (balnReturnedEarly && lockedBalnAmount) {
      return new BigNumber(lockedBalnAmount.toFixed(0)).minus(balnReturnedEarly).toNumber();
    }
  }, [balnReturnedEarly, lockedBalnAmount]);

  const earningPower = useMemo(() => {
    if (!dynamicBBalnAmount) return;
    if (maxRewardThreshold.isEqualTo(0)) return new BigNumber(100);
    const max = bBalnAmount.plus(maxRewardThreshold);
    const ePower = BigNumber.min(dynamicBBalnAmount.dividedBy(max).times(60).plus(40), new BigNumber(100));
    return !ePower.isNaN() ? ePower : new BigNumber(40);
  }, [bBalnAmount, dynamicBBalnAmount, maxRewardThreshold]);

  const handleGlobalHover = (isHover: boolean) => {
    setTooltipHovered(isHover);
    setGlobalTooltip && setGlobalTooltip(isHover);
  };

  return (
    <>
      {account &&
      (balnBalanceAvailable.isGreaterThan(0) ||
        bBalnAmount.isGreaterThan(0) ||
        lockedBalnAmount?.greaterThan(0) ||
        stakedBalance?.isGreaterThan(0)) ? (
        <>
          <Flex alignItems="flex-start" margin={simple && isAdjusting ? '0 0 15px' : ''}>
            <Flex
              flexDirection={isSmallScreen ? 'column' : 'row'}
              alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}
            >
              <Typography variant={titleVariant} paddingRight={'7px'} paddingBottom={isSmallScreen ? '5px' : '0'}>
                {title}{' '}
              </Typography>
              <Typography padding="0 3px 2px 0" style={titleVariant === 'h4' ? { transform: 'translateY(1px)' } : {}}>
                {simple ? (
                  <>
                    {earningPower && (numberOfPositions || dynamicBBalnAmount.isGreaterThan(0) || isAdjusting) && (
                      <span style={{ marginRight: '8px' }}>{earningPower.toFixed(0)}%</span>
                    )}
                    <Tooltip
                      show={showGlobalTooltip || tooltipHovered}
                      offset={isSuperExtraSmallScreen ? [0, 66] : isSmallScreen ? [0, 40] : [0, 10]}
                      text={
                        <>
                          {!isAdjusting && <EarningPowerTooltipContent />}
                          {(isAdjusting || numberOfPositions || dynamicBBalnAmount.isGreaterThan(0)) && (
                            <Typography mt={!isAdjusting ? 3 : 0}>
                              You have{' '}
                              <strong>
                                {dynamicBBalnAmount.dp(dynamicBBalnAmount.isGreaterThan(100) ? 0 : 2).toFormat()} bBALN
                              </strong>
                              . {numberOfPositions ? maxRewardNoticeContent : ''}
                            </Typography>
                          )}
                        </>
                      }
                      placement="top"
                      forcePlacement={true}
                      width={280}
                      strategy="absolute"
                    >
                      <QuestionWrapper
                        onMouseEnter={() => handleGlobalHover(true)}
                        onMouseLeave={() => handleGlobalHover(false)}
                        onTouchStart={() => handleGlobalHover(true)}
                        onTouchCancel={() => handleGlobalHover(false)}
                        style={{ transform: 'translateY(1px)' }}
                      >
                        <QuestionIcon width={14} />
                      </QuestionWrapper>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip
                      text={maxRewardNoticeContent}
                      width={215}
                      show={
                        !!showMaxRewardsNotice &&
                        !!numberOfPositions &&
                        isAdjusting &&
                        maxRewardThreshold.isGreaterThan(0)
                      }
                      placement="top-start"
                      forcePlacement={true}
                      strategy="absolute"
                      offset={[-18, 20]}
                    >
                      {isAdjusting ? dynamicBBalnAmount.dp(2).toFormat() : bBalnAmount.dp(2).toFormat()}
                    </Tooltip>
                    {' bBALN'}
                    <QuestionHelper
                      text={
                        <>
                          <Trans>
                            Lock up BALN to hold voting power and boost your earning potential by up to 2.5 x.
                          </Trans>
                          <Typography mt={2}>
                            <Trans>
                              The longer you lock up BALN, the more bBALN (Boosted BALN) you'll receive; the amount will
                              decrease over time.
                            </Trans>
                          </Typography>
                          {showMaxRewardsNotice && !isAdjusting && numberOfPositions && (
                            <>
                              <Divider my={2} />
                              <Typography fontWeight={700}>{maxRewardNoticeContent}</Typography>
                            </>
                          )}
                        </>
                      }
                    />
                  </>
                )}
              </Typography>
            </Flex>

            {stakedBalance?.isEqualTo(0) && (
              <ButtonsWrap verticalButtons={!simple}>
                {isAdjusting ? (
                  <>
                    <TextButton
                      onClick={handleCancelAdjusting}
                      marginBottom={isSuperSmallScreen ? '5px' : 0}
                      marginLeft={[0, 0, simple ? '-40px' : 0]}
                    >
                      Cancel
                    </TextButton>
                    <Button
                      disabled={
                        bBalnAmount.isGreaterThan(0)
                          ? differenceBalnAmount.isZero() && !isPeriodChanged
                          : differenceBalnAmount.isZero()
                      }
                      onClick={toggleConfirmationModalOpen}
                      fontSize={14}
                      warning={balnSliderAmount.isLessThan(beforeBalnAmount)}
                    >
                      Confirm
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={
                      hasLockExpired && lockedBalnAmount?.greaterThan(0)
                        ? toggleWithdrawModalOpen
                        : handleEnableAdjusting
                    }
                    fontSize={14}
                  >
                    {buttonText}
                  </Button>
                )}
              </ButtonsWrap>
            )}
          </Flex>

          {stakedBalance?.isGreaterThan(0) ? (
            <UnstakePrompt stakedBalance={stakedBalance} availableBalance={balnBalanceAvailable} />
          ) : (
            <>
              <SliderWrap sliderBg={sliderBg} sliderMargin={sliderMargin}>
                {lockupNotice && (
                  <Typography className={`lockup-notice${isAdjusting ? '' : ' show'}`}>{lockupNotice}</Typography>
                )}
                {shouldShowLock && isAdjusting && (
                  <Box style={{ position: 'relative' }}>
                    {simple ? (
                      <StyledThreshold
                        position={lockbarPercentPosition}
                        flipTextDirection={lockbarPercentPosition < 50}
                      >
                        <MetaData as="dl" style={{ textAlign: 'right' }}>
                          <dd>Locked</dd>
                        </MetaData>
                      </StyledThreshold>
                    ) : (
                      <Threshold position={lockbarPercentPosition} flipTextDirection={lockbarPercentPosition < 50}>
                        <MetaData as="dl" style={{ textAlign: 'right' }}>
                          <dd>Locked</dd>
                        </MetaData>
                      </Threshold>
                    )}
                  </Box>
                )}

                <Box
                  margin="10px 0"
                  className={balnSliderAmount.isLessThan(beforeBalnAmount) ? 'withdraw-warning' : ''}
                >
                  <Nouislider
                    disabled={!isAdjusting}
                    id="slider-bbaln"
                    start={[Number(lockedBalnAmount?.toFixed(0) || 0)]}
                    connect={[true, false]}
                    step={1}
                    range={{
                      min: [0],
                      max: [balnTotal ? balnTotal.dp(0, BigNumber.ROUND_DOWN).toNumber() : 1],
                    }}
                    instanceRef={instance => {
                      if (instance) {
                        sliderInstance.current = instance;
                      }
                    }}
                    onSlide={onSlide}
                  />
                </Box>

                <Flex justifyContent="space-between" flexWrap={'wrap'} marginTop={isAdjusting ? '15px' : ''}>
                  <Flex alignItems="center">
                    {isAdjusting ? (
                      <BalnPreviewInput
                        type="text"
                        disabled={!isAdjusting}
                        value={balnSliderAmount.toNumber()}
                        onChange={handleBBalnInputChange}
                      />
                    ) : (
                      <Typography paddingRight={'5px'}>{balnSliderAmount.toFormat()}</Typography>
                    )}

                    <Typography paddingRight={'15px'}>
                      {' '}
                      / {balnTotal ? balnTotal.dp(0, BigNumber.ROUND_DOWN).toFormat(0) : '-'} BALN
                    </Typography>
                  </Flex>

                  {/* Show unlocked date */}
                  {hasLockExpired && lockedBalnAmount?.greaterThan(0) && !isAdjusting && (
                    <Typography>{t`Available since ${formatDate(lockedUntil)}`}</Typography>
                  )}

                  {/* Show selected or locked time period */}
                  {(bBalnAmount?.isGreaterThan(0) || isAdjusting) && (
                    <Typography paddingTop={isAdjusting ? '5px' : '0'}>
                      {shouldBoost ? (
                        <>
                          {t`Locked until`}{' '}
                          {isAdjusting ? (
                            <>
                              <ClickAwayListener onClickAway={closeDropdown}>
                                <UnderlineTextWithArrow
                                  onClick={handlePeriodDropdownToggle}
                                  text={formatDate(
                                    getClosestUnixWeekStart(
                                      new Date(
                                        new Date().setDate(new Date().getDate() + (selectedPeriod.weeks * 7 - 7)),
                                      ).getTime(),
                                    ),
                                  )}
                                  arrowRef={periodArrowRef}
                                />
                              </ClickAwayListener>
                              <DropdownPopper
                                show={Boolean(periodDropdownAnchor)}
                                anchorEl={periodDropdownAnchor}
                                placement="bottom-end"
                              >
                                <MenuList>
                                  {availablePeriods
                                    .filter(
                                      (period, index) =>
                                        index === 0 || comparePeriods(period, availablePeriods[index - 1]) !== 0,
                                    )
                                    .map(period => (
                                      <MenuItem key={period.weeks} onClick={() => handleLockingPeriodChange(period)}>
                                        {period.name}
                                      </MenuItem>
                                    ))}
                                </MenuList>
                              </DropdownPopper>
                            </>
                          ) : (
                            formatDate(lockedUntil)
                          )}
                        </>
                      ) : (
                        isAdjusting && (
                          <Typography fontSize={14} color="#fb6a6a">
                            {t`Pay a ${getFormattedNumber(
                              earlyWithdrawPenalty || 0,
                              'number2',
                            )} BALN fee to unlock early.`}
                          </Typography>
                        )
                      )}
                    </Typography>
                  )}
                </Flex>
              </SliderWrap>
            </>
          )}
        </>
      ) : (
        <>
          <Typography variant={titleVariant} marginBottom={6}>
            <Trans>{title}</Trans>
            {simple && (
              <QuestionWrapper style={{ marginLeft: '5px', transform: 'translateY(1px)' }}>
                <QuestionHelper width={330} text={<EarningPowerTooltipContent />} />
              </QuestionWrapper>
            )}
          </Typography>
          {simple ? (
            !account && signedInWallets.length > 0 ? (
              <Typography fontSize={14} opacity={0.75} mb={5}>
                <Trans>Sign in on ICON, then lock up BALN to boost your rewards.</Trans>
              </Typography>
            ) : (
              <Typography fontSize={14} opacity={0.75} mb={5}>
                <Trans>Earn or buy BALN, then lock it up here to boost your rewards.</Trans>
              </Typography>
            )
          ) : (
            <Typography fontSize={14} opacity={0.75}>
              <Trans>Earn or buy BALN, then lock it up here to boost your earning potential and voting power.</Trans>
            </Typography>
          )}
        </>
      )}

      {/* Adjust Modal */}
      <Modal isOpen={confirmationModalOpen} onDismiss={toggleConfirmationModalOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldBoost ? t`Lock up Balance Tokens?` : t`Unlock Balance Tokens?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {shouldBoost ? balnSliderAmount.toFormat(0) : lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })}
            {' BALN'}
          </Typography>
          {!shouldBoost && earlyWithdrawPenalty && (
            <Typography textAlign="center" fontSize={14} color="#fb6a6a">
              {t`Minus unlock fee of ${getFormattedNumber(earlyWithdrawPenalty, 'number2')} BALN`}
            </Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })} BALN
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {shouldBoost ? balnSliderAmount.toFormat(0) : '0'} BALN
              </Typography>
            </Box>
          </Flex>

          {shouldBoost && (
            <Typography textAlign="center">
              <Trans>Your BALN will be locked until</Trans>{' '}
              <strong>{formatDate(getClosestUnixWeekStart(getWeekOffsetTimestamp(selectedPeriod.weeks)), true)}</strong>
              .
            </Typography>
          )}

          {shouldNotifyOfVotingPower && (
            <Typography textAlign="center" mt="15px">
              <Trans>
                To apply your increased voting power to liquidity incentives, update your allocation for each pool.
              </Trans>
            </Typography>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleConfirmationModalOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleBoostUpdate} fontSize={14} warning={!shouldBoost}>
                  {shouldBoost
                    ? 'Lock up BALN'
                    : t`Unlock ${getFormattedNumber(balnReturnedEarly ?? 0, 'number2')} BALN`}
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModalOpen} onDismiss={toggleWithdrawModalOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            <Trans>Withdraw Balance Tokens</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20} mb={2}>
            {lockedBalnAmount?.toFixed(0, { groupSeparator: ',' })} BALN
          </Typography>
          <Typography textAlign="center" fontSize={14} mb={1}>
            <Trans>You'll need to relock BALN to hold voting power and boost your earning potential.</Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top" flexWrap={'wrap'}>
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleWithdrawModalOpen} fontSize={14}>
                  Cancel
                </TextButton>
                <Button disabled={!hasEnoughICX} onClick={handleWithdraw} fontSize={14}>
                  {t`Withdraw BALN`}
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
}
