import React, { useMemo, useRef, useState } from 'react';

import { addresses } from '@balancednetwork/balanced-js';
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
import { inputRegex } from 'app/components/Form';
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
  useTotalSuply,
  Source,
  useBBalnChangeSelectedPeriod,
  useSelectedPeriod,
  useDynamicBBalnAmount,
  useWorkingBalance,
  useSources,
  useDBBalnAmountDiff,
  usePastMonthFeesDistributed,
} from 'store/bbaln/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { escapeRegExp, parseUnits } from 'utils'; // match escaped "." characters via in a non-capturing group
import { showMessageOnBeforeUnload } from 'utils/messages';

import { BoxPanel } from '../../Panel';
import { DropdownPopper } from '../../Popover';
import QuestionHelper from '../../QuestionHelper';
import { MetaData } from '../PositionDetailPanel';
import {
  BalnPreviewInput,
  BoostedBox,
  BoostedInfo,
  ButtonsWrap,
  LiquidityDetails,
  LiquidityDetailsWrap,
  PoolItem,
  SliderWrap,
  StyledTypography,
  Threshold,
} from './styledComponents';
import UnstakePrompt from './UnstakePrompt';
import { WEEK_IN_MS, lockingPeriods, formatDate, getClosestUnixWeekStart, getWeekOffsetTimestamp } from './utils';

export default function BBalnPanel() {
  const { account } = useIconReact();
  const bBalnAmount = useBBalnAmount();
  const lockedBalnAmount = useLockedBaln();
  const lockedUntil = useLockedUntil();
  const totalSupplyBBaln = useTotalSuply();
  const dynamicBBalnAmount = useDynamicBBalnAmount();
  const bbalnAmountDiff = useDBBalnAmountDiff();
  const sources = useSources();
  const { data: hasLockExpired } = useHasLockExpired();
  const { typedValue, isAdjusting, inputType } = useBBalnSliderState();
  const { onFieldAInput, onSlide, onAdjust: adjust } = useBBalnSliderActionHandlers();
  const changePeriod = useBBalnChangeSelectedPeriod();
  const getWorkingBalance = useWorkingBalance();
  const selectedPeriod = useSelectedPeriod();
  const sliderInstance = React.useRef<any>(null);
  const [showLiquidityTooltip, setShowLiquidityTooltip] = useState(false);
  const arrowRef = React.useRef(null);
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const shouldLedgerSign = useShouldLedgerSign();
  const [periodDropdownAnchor, setPeriodDropdownAnchor] = useState<HTMLElement | null>(null);
  const periodArrowRef = useRef(null);
  const balnDetails = useBALNDetails();
  const hasEnoughICX = useHasEnoughICX();
  const isSmallScreen = useMedia('(max-width: 540px)');
  const isSuperSmallScreen = useMedia('(max-width: 400px)');
  const addTransaction = useTransactionAdder();
  const { data: pastMonthFees } = usePastMonthFeesDistributed();

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
    setWithdrawModalOpen(false);
  };

  const handleCancelAdjusting = () => {
    adjust(false);
    setPeriodDropdownAnchor(null);
    setShowLiquidityTooltip(false);
    changeShouldLedgerSign(false);
  };

  const showLPTooltip = () => {
    setShowLiquidityTooltip(true);
  };

  const hideLPTooltip = () => {
    setShowLiquidityTooltip(false || isAdjusting);
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
            summary: t`Unlocked ${lockedBalnAmount?.divide(2).toFixed(0, { groupSeparator: ',' })} BALN.`,
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

  const isPeriodChanged = useMemo(() => {
    const lockTimestamp = getWeekOffsetTimestamp(selectedPeriod.weeks);
    return getClosestUnixWeekStart(lockTimestamp).getTime() !== lockedUntil?.getTime();
  }, [lockedUntil, selectedPeriod]);

  const availablePeriods = useMemo(() => {
    if (lockedUntil) {
      const availablePeriods = lockingPeriods.filter(period => {
        return lockedUntil ? lockedUntil < new Date(new Date().setDate(new Date().getDate() + period.weeks * 7)) : true;
      });
      return availablePeriods.length ? availablePeriods : [lockingPeriods[lockingPeriods.length - 1]];
    } else {
      return lockingPeriods;
    }
  }, [lockedUntil]);

  // reset loan ui state if cancel adjusting
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
    const nextUserInput = event.target.value.replace(/,/g, '.');

    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      let nextInput = nextUserInput;
      const value = new BigNumber(nextUserInput || '0');

      if (value.isGreaterThan(balnBalanceAvailable)) {
        nextInput = balnBalanceAvailable.dp(2).toFixed();
      } else if (value.isLessThan(0)) {
        nextInput = '0';
      }

      onFieldAInput(nextInput || '0');
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

  const boostedLPNumbers = useMemo(() => {
    if (isAdjusting) {
      return (
        boostedLPs &&
        Object.values(boostedLPs).map(boostedLP =>
          getWorkingBalance(boostedLP.balance, boostedLP.supply).dividedBy(boostedLP.balance).dp(2).toNumber(),
        )
      );
    } else {
      return (
        boostedLPs &&
        Object.values(boostedLPs).map(boostedLP =>
          boostedLP.workingBalance.dividedBy(boostedLP.balance).dp(2).toNumber(),
        )
      );
    }
  }, [isAdjusting, boostedLPs, getWorkingBalance]);

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

  const maxRewardNoticeContent = `${bBalnAmount
    ?.plus(maxRewardThreshold)
    .toFormat(2)} bBALN required for maximum rewards.`;

  return (
    <BoxPanel bg="bg2" flex={1}>
      {balnBalanceAvailable.isGreaterThan(0) || stakedBalance?.isGreaterThan(0) ? (
        <>
          <Flex alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}>
            <Flex
              flexDirection={isSmallScreen ? 'column' : 'row'}
              alignItems={isSmallScreen ? 'flex-start' : 'flex-end'}
            >
              <Typography variant="h3" paddingRight={'10px'} paddingBottom={isSmallScreen ? '5px' : '0'}>
                Boost rewards{' '}
              </Typography>
              <Typography padding="0 3px 2px 0">
                <Tooltip
                  text={maxRewardNoticeContent}
                  width={200}
                  show={isAdjusting}
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
                      {!isAdjusting && (
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
                <Typography className={`lockup-notice${isAdjusting ? '' : ' show'}`}>
                  Lock up BALN to boost your earning potential.
                </Typography>
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
                      max: [balnTotal ? balnTotal.dp(0).toNumber() : 1],
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
                      / {balnTotal ? balnTotal.toFormat(0, BigNumber.ROUND_DOWN) : '-'} BALN
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
                                  {availablePeriods.map(period => (
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
                            <Trans>Pay a 50% fee to unlock your BALN early.</Trans>
                          </Typography>
                        )
                      )}
                    </Typography>
                  )}
                </Flex>
              </SliderWrap>
              <BoostedInfo>
                <BoostedBox>
                  <Typography fontSize={16} color="#FFF">
                    {bBalnAmount.isEqualTo(0) && !isAdjusting
                      ? 'N/A'
                      : totalSupplyBBaln
                      ? isAdjusting
                        ? differenceBalnAmount.isGreaterThanOrEqualTo(0)
                          ? `${bBalnAmount
                              .plus(bbalnAmountDiff)
                              .dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff))
                              .times(100)
                              .toPrecision(3)} %`
                          : `${bBalnAmount
                              .minus(bbalnAmountDiff)
                              .dividedBy(totalSupplyBBaln.minus(bbalnAmountDiff))
                              .times(100)
                              .toPrecision(3)} %`
                        : `${bBalnAmount.dividedBy(totalSupplyBBaln).times(100).toPrecision(3)} %`
                      : '-'}
                  </Typography>
                  <Typography marginLeft={pastMonthFees ? '14px' : ''}>
                    Network fees
                    <QuestionHelper
                      iconStyle={{ position: 'relative', transform: 'translate3d(1px, 2px, 0)' }}
                      strategy="absolute"
                      placement="bottom"
                      offset={[0, 15]}
                      text={
                        <>
                          <Trans>
                            Your share of the fees distributed to bBALN holders, calculated with Your bBALN ÷ Total
                            bBALN.
                          </Trans>
                          {pastMonthFees && (
                            <Typography mt={2} color="text1">
                              <>{t`$${pastMonthFees.total.toFormat(0)} was distributed over the last 30 days`}</>
                              {totalSupplyBBaln && bBalnAmount && bbalnAmountDiff && bBalnAmount.isGreaterThan(0) ? (
                                <>
                                  {t`, so you would have received`}{' '}
                                  <strong>{t`$${pastMonthFees?.total
                                    .times(
                                      bBalnAmount
                                        .plus(bbalnAmountDiff)
                                        .dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff)),
                                    )
                                    .toFormat(2)}.`}</strong>
                                </>
                              ) : (
                                '.'
                              )}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </Typography>
                </BoostedBox>
                <BoostedBox>
                  <Typography fontSize={16} color="#FFF">
                    {sources && sources.Loans.balance.isEqualTo(0)
                      ? 'N/A'
                      : isAdjusting
                      ? sources && totalSupplyBBaln
                        ? `${getWorkingBalance(sources.Loans.balance, sources.Loans.supply)
                            .dividedBy(sources.Loans.balance)
                            .toFixed(2)} x`
                        : '-'
                      : sources
                      ? `${sources.Loans.workingBalance.dividedBy(sources.Loans.balance).toFixed(2)} x`
                      : '-'}
                  </Typography>
                  <Typography>Loan rewards</Typography>
                </BoostedBox>
                <BoostedBox className="no-border">
                  <Typography fontSize={16} color="#FFF">
                    {boostedLPNumbers
                      ? boostedLPNumbers.length !== 0
                        ? boostedLPNumbers.length === 1 ||
                          Math.min(...boostedLPNumbers) === Math.max(...boostedLPNumbers)
                          ? `${boostedLPNumbers[0].toFixed(2)} x`
                          : `${Math.min(...boostedLPNumbers).toFixed(2)} x - ${Math.max(...boostedLPNumbers).toFixed(
                              2,
                            )} x`
                        : 'N/A'
                      : '-'}
                  </Typography>
                  <StyledTypography ref={arrowRef}>
                    Liquidity rewards{' '}
                    <QuestionIcon width={14} onMouseEnter={showLPTooltip} onMouseLeave={hideLPTooltip} />
                  </StyledTypography>
                </BoostedBox>
                <LiquidityDetailsWrap show={showLiquidityTooltip || isAdjusting}>
                  <LiquidityDetails>
                    {boostedLPNumbers !== undefined && boostedLPNumbers?.length !== 0 ? (
                      boostedLPs &&
                      Object.keys(boostedLPs).map(boostedLP => {
                        return (
                          <PoolItem key={boostedLP}>
                            <Typography fontSize={16} color="#FFF">
                              {`${
                                isAdjusting
                                  ? getWorkingBalance(boostedLPs[boostedLP].balance, boostedLPs[boostedLP].supply)
                                      .dividedBy(boostedLPs[boostedLP].balance)
                                      .toFixed(2)
                                  : boostedLPs[boostedLP].workingBalance
                                      .dividedBy(boostedLPs[boostedLP].balance)
                                      .toFixed(2)
                              } x`}
                            </Typography>
                            <Typography fontSize={14}>{boostedLP}</Typography>
                          </PoolItem>
                        );
                      })
                    ) : (
                      <Typography paddingTop="10px" marginBottom="-5px" maxWidth={250} textAlign="left">
                        <Trans>You must have supplied liquidity in any of BALN incentivised pools.</Trans>
                      </Typography>
                    )}
                  </LiquidityDetails>
                </LiquidityDetailsWrap>
              </BoostedInfo>
            </>
          )}
        </>
      ) : (
        <>
          <Typography variant="h3" marginBottom={6}>
            <Trans>Boost rewards</Trans>
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
          {!shouldBoost && (
            <Typography textAlign="center" fontSize={14} color="#fb6a6a">
              {t`Minus 50% fee: ${lockedBalnAmount?.divide(2).toFixed(0, { groupSeparator: ',' })} BALN`}
            </Typography>
          )}

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {balnBalanceAvailable.toFormat(0)} BALN
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {shouldBoost
                  ? balnBalanceAvailable.minus(differenceBalnAmount).toFormat(0)
                  : balnBalanceAvailable.plus(new BigNumber(lockedBalnAmount?.toFixed() || 0).div(2)).toFormat(0)}{' '}
                BALN
              </Typography>
            </Box>
          </Flex>

          {shouldBoost && (
            <Typography textAlign="center">
              Your BALN will be locked until{' '}
              <strong>{formatDate(getClosestUnixWeekStart(getWeekOffsetTimestamp(selectedPeriod.weeks)), true)}</strong>
              .
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
                  {shouldBoost ? 'Lock up BALN' : 'Unlock all BALN for a 50% fee'}
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
    </BoxPanel>
  );
}
