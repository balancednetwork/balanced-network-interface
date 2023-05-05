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
  Source,
  useBBalnChangeSelectedPeriod,
  useSelectedPeriod,
  useDynamicBBalnAmount,
  useSources,
  useTimeRemaining,
} from 'store/bbaln/hooks';
import { usePowerLeft } from 'store/liveVoting/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { getFormattedNumber } from 'utils/formatter';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { DropdownPopper } from '../../Popover';
import QuestionHelper from '../../QuestionHelper';
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

export default function BBalnSlider({
  title,
  titleVariant = 'h3',
  showMaxRewardsNotice,
  lockupNotice,
  onActiveSlider,
  onDisabledSlider,
}: {
  title: string;
  lockupNotice: string;
  titleVariant?: 'h3' | 'h2';
  showMaxRewardsNotice?: boolean;
  onActiveSlider?: () => void;
  onDisabledSlider?: () => void;
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
  const addTransaction = useTransactionAdder();

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
            summary: t`Unlocked ${balnReturnedEarly && getFormattedNumber(balnReturnedEarly, 'number')} BALN.`,
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

  const boostedLPs = useMemo(() => {
    if (sources) {
      return Object.keys(sources).reduce((LPs, sourceName) => {
        if (sourceName !== 'Loans' && sources[sourceName].balance.isGreaterThan(0)) {
          LPs[sourceName] = { ...sources[sourceName] };
        }
        return LPs;
      }, {} as { [key in string]: Source });
    }
  }, [sources]);

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

  const maxRewardNoticeContent = maxRewardThreshold.isGreaterThan(0)
    ? `${bBalnAmount?.plus(maxRewardThreshold).toFormat(2)} bBALN required for maximum BALN rewards.`
    : 'You have reached maximum BALN rewards.';

  const hasLPOrLoan = sources && boostedLPs && (sources.Loans.balance.isGreaterThan(0) || boostedLPs.length);

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

  return (
    <>
      {balnBalanceAvailable.isGreaterThan(0) ||
      bBalnAmount.isGreaterThan(0) ||
      lockedBalnAmount?.greaterThan(0) ||
      stakedBalance?.isGreaterThan(0) ? (
        <>
          <Flex alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}>
            <Flex
              flexDirection={isSmallScreen ? 'column' : 'row'}
              alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}
            >
              <Typography variant={titleVariant} paddingRight={'10px'} paddingBottom={isSmallScreen ? '5px' : '0'}>
                {title}{' '}
              </Typography>
              <Typography padding="0 3px 2px 0">
                <Tooltip
                  text={maxRewardNoticeContent}
                  width={215}
                  show={!!showMaxRewardsNotice && !!hasLPOrLoan && isAdjusting && maxRewardThreshold.isGreaterThan(0)}
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
                      <Trans>Lock up BALN to hold voting power and boost your earning potential by up to 2.5 x.</Trans>
                      <Typography mt={2}>
                        <Trans>
                          The longer you lock up BALN, the more bBALN (Boosted BALN) you'll receive; the amount will
                          decrease over time.
                        </Trans>
                      </Typography>
                      {showMaxRewardsNotice && !isAdjusting && hasLPOrLoan && (
                        <>
                          <Divider my={2} />
                          <Typography fontWeight={700}>{maxRewardNoticeContent}</Typography>
                        </>
                      )}
                    </>
                  }
                />
              </Typography>
            </Flex>

            {stakedBalance?.isEqualTo(0) && (
              <ButtonsWrap>
                {isAdjusting ? (
                  <>
                    <TextButton onClick={handleCancelAdjusting} marginBottom={isSuperSmallScreen ? '5px' : 0}>
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
              <SliderWrap>
                <Typography className={`lockup-notice${isAdjusting ? '' : ' show'}`}>{lockupNotice}</Typography>
                {shouldShowLock && isAdjusting && (
                  <Box style={{ position: 'relative' }}>
                    <Threshold position={lockbarPercentPosition} flipTextDirection={lockbarPercentPosition < 50}>
                      <MetaData as="dl" style={{ textAlign: 'right' }}>
                        <dd>Locked</dd>
                      </MetaData>
                    </Threshold>
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

                <Flex justifyContent="space-between" flexWrap={'wrap'}>
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
                    <Typography paddingTop={isAdjusting ? '6px' : '0'}>
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
                            {t`Pay ${getFormattedNumber(
                              earlyWithdrawPenalty || 0,
                              'number2',
                            )} BALN fee to unlock the rest early.`}
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
          </Typography>
          <Typography fontSize={14} opacity={0.75}>
            <Trans>Earn or buy BALN, then lock it up here to boost your earning potential and voting power.</Trans>
          </Typography>
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
              {t`Minus ${getFormattedNumber(earlyWithdrawPenalty, 'number2')} BALN fee`}
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
