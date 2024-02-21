import React, { useMemo } from 'react';

import { MessageDescriptor } from '@lingui/core';
import { defineMessage, t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { AnimatePresence, motion } from 'framer-motion';
import Nouislider from 'nouislider-react';
import ClickAwayListener from 'react-click-away-listener';
import { isIOS } from 'react-device-detect';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Divider from 'app/components/Divider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { QuestionWrapper } from 'app/components/QuestionHelper';
import Tooltip, { TooltipContainer } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useRebalancingDataQuery_DEPRECATED, Period } from 'queries/rebalancing';
import { useRatesQuery } from 'queries/reward';
import { useCollateralInputAmountInUSD, useCollateralType, useIsHandlingICX } from 'store/collateral/hooks';
import {
  useLoanInputAmount,
  useThresholdPrices,
  useCollateralLockedSliderPos,
  useLoanAvailableAmount,
  useInterestRate,
} from 'store/loan/hooks';
import { useOraclePrice } from 'store/oracle/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useCurrentCollateralRatio } from 'store/reward/hooks';
import { InterestPeriod } from 'types';
import { formatBigNumber, getAccumulatedInterest } from 'utils';

import { DropdownPopper } from '../Popover';
import { StyledSkeleton } from '../ProposalInfo';
import { RebalancingInfo } from './LoanPanel';

const PERIODS: Period[] = [Period.day, Period.week, Period.month, Period.all];

const PERIOD_LABELS: { [key: string]: MessageDescriptor } = {
  [Period.day]: defineMessage({ message: 'Past day' }),
  [Period.week]: defineMessage({ message: 'Past week' }),
  [Period.month]: defineMessage({ message: 'Past month' }),
  [Period.all]: defineMessage({ message: 'All time' }),
};

const INTEREST_PERIODS: { [key: string]: InterestPeriod } = {
  day: { display: t`Daily`, days: 1 },
  week: { display: t`Weekly`, days: 7 },
  month: { display: t`Monthly`, days: 30 },
  year: { display: t`Yearly`, days: 365 },
};

const PositionDetailPanel = () => {
  const oraclePrice = useOraclePrice();
  const { data: rates } = useRatesQuery();
  const collateralType = useCollateralType();
  const locale = useActiveLocale();
  const { data: interestRate } = useInterestRate(collateralType);
  const upLarge = useMedia('(min-width: 1200px)');
  const upMedium = useMedia('(min-width: 1000px)');
  const smallSp = useMedia('(max-width: 360px)');
  const shouldShowRebalancingTooltipAnchor = useMedia(
    `(min-width: ${'pl-PL,fr-FR'.indexOf(locale) >= 0 ? '400px' : '360px'})`,
  );
  const [show, setShow] = React.useState<boolean>(false);
  const [showRebalancing, setShowRebalancing] = React.useState<boolean>(false);
  const [period, setPeriod] = React.useState<Period>(Period.day);
  const [interestPeriod, setInterestPeriod] = React.useState<InterestPeriod>(INTEREST_PERIODS.week);
  const isHandlingICX = useIsHandlingICX();
  const heightenBars =
    (useMedia('(max-width: 359px)') && 'es-ES,nl-NL,de-DE,fr-FR'.indexOf(locale) >= 0) || 'pl-PL'.indexOf(locale) >= 0;

  const open = React.useCallback(() => setShow(true), [setShow]);
  const close = React.useCallback(() => setShow(false), [setShow]);

  // ratio
  const ratio = useRatio();

  // Rebalancing section
  const { data } = useRebalancingDataQuery_DEPRECATED(period);
  const totalCollateralSold = React.useMemo(() => {
    return data?.totalCollateralSold || new BigNumber(0);
  }, [data]);

  // loan
  const loanInputAmount = useLoanInputAmount();

  const collateralInputAmountInUSD = useCollateralInputAmountInUSD();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  const [lockThresholdPrice, liquidationThresholdPrice] = useThresholdPrices();

  const currentRatio = useCurrentCollateralRatio();

  var lowRisk1 = (900 * 100) / currentRatio.toNumber();

  const availableLoanAmount = useLoanAvailableAmount();

  const isLockWarning = useMemo(
    () =>
      oraclePrice &&
      (availableLoanAmount.isGreaterThan(0.005) ? lockThresholdPrice.minus(oraclePrice).isGreaterThan(-0.01) : true),
    [lockThresholdPrice, oraclePrice, availableLoanAmount],
  );

  const isPassAllCollateralLocked = oraclePrice?.isLessThan(lockThresholdPrice);

  // handle rebalancing logic
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  //handle interest period logic
  const [interestAnchor, setInterestAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);
  const arrowRefInterest = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeMenu = () => {
    setAnchor(null);
  };

  const handleInterestToggle = (e: React.MouseEvent<HTMLElement>) => {
    setInterestAnchor(anchor ? null : arrowRefInterest.current);
  };

  const handlePeriod = (p: Period) => {
    closeMenu();
    setPeriod(p);
  };

  const closeInterestDropdown = () => {
    setInterestAnchor(null);
  };

  const handleInterestPeriod = (p: InterestPeriod) => {
    closeInterestDropdown();
    setInterestPeriod(p);
  };

  const pos = useCollateralLockedSliderPos();

  const openRebalancing = React.useCallback(() => setShowRebalancing(true), [setShowRebalancing]);
  const closeRebalancing = React.useCallback(() => setShowRebalancing(false), [setShowRebalancing]);
  const [shouldShowRebalancingAveragePrice, setShouldShowRebalancingAveragePrice] = React.useState(false);
  const shouldShowSeparateTooltip = useMedia('(min-width: 1000px)');
  const rebalancingTotal = data?.totalRepaid || new BigNumber(0);
  const averageSoldICXPrice =
    totalCollateralSold && totalCollateralSold.isZero() ? new BigNumber(0) : rebalancingTotal.div(totalCollateralSold);
  const averageRebalancingPriceText = (
    <>
      Your average redemption price was{' '}
      <strong>
        {'$'}
        {averageSoldICXPrice.toFixed(2)}
      </strong>
      .
    </>
  );

  React.useEffect(() => {
    setShouldShowRebalancingAveragePrice(totalCollateralSold ? !totalCollateralSold.isZero() : false);
  }, [totalCollateralSold, setShouldShowRebalancingAveragePrice]);

  return (
    <AnimatePresence>
      {!(loanInputAmount.isNegative() || loanInputAmount.isZero()) && (
        <MotionActivityPanel
          bg="bg2"
          initial={{ y: -50, opacity: 0, height: 0 }}
          animate={{ y: 0, opacity: 1, height: 'auto' }}
          exit={{ x: -400, opacity: 0 }}
        >
          <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 'initial', 'initial', 350]}>
            <Typography variant="h2" mb={5}>
              <Trans>Position details</Trans>
            </Typography>

            <Flex>
              <Box flex={1}>
                <Typography mb={1}>
                  <Trans>Collateral</Trans>
                </Typography>
                <Typography variant="p" fontSize={18}>
                  {collateralInputAmountInUSD ? (
                    `$${collateralInputAmountInUSD.dp(2).toFormat()}`
                  ) : (
                    <StyledSkeleton width={90} animation="wave" />
                  )}
                </Typography>
              </Box>

              <VerticalDivider mr={8} />

              <Box flex={1}>
                <Typography mb={1}>
                  <Trans>Loan</Trans>
                </Typography>
                <Typography variant="p" fontSize={18} as="span">
                  ${loanInputAmount.dp(2).toFormat()}
                </Typography>
              </Box>
            </Flex>
            <Divider my={4} />
            <Typography mb={2}>
              {t`The current ${collateralType === 'sICX' ? 'ICX' : collateralType} price is`}{' '}
              <span className="white">
                $
                {collateralType === 'sICX' && ratio.ICXUSDratio
                  ? ratio.ICXUSDratio.dp(4).toFormat()
                  : oraclePrice?.dp(0).toFormat()}
              </span>
              .
            </Typography>
            <Typography mb={2}>
              <Trans>The current bnUSD price is</Trans>{' '}
              <span className="white">{rates && `$${rates['bnUSD'].dp(4).toFormat()}`}</span>.
            </Typography>
          </BoxPanel>

          <BoxPanel bg="bg2" flex={1}>
            <Typography variant="h3">
              <Trans>Risk ratio</Trans>{' '}
              {!smallSp && (
                <QuestionWrapper onClick={open} {...(!isIOS ? { onMouseEnter: open } : null)} onMouseLeave={close}>
                  <QuestionIcon width={14} style={{ marginTop: -5 }} />
                </QuestionWrapper>
              )}
            </Typography>

            <Flex
              alignItems="center"
              justifyContent="space-between"
              mt={heightenBars ? [70, 5, 5, 5, 5] : [10, 5, 5, 5, 5]}
              mb={4}
            >
              <LeftChip
                bg="primary"
                style={{
                  background: isPassAllCollateralLocked
                    ? '#fb6a6a'
                    : 'linear-gradient(to right, #2ca9b7 ' + lowRisk1 + '%, #144a68 ' + lowRisk1 + '%)',
                }}
              />

              <Box flex={1} style={{ position: 'relative' }} className={`slider-warning-${isPassAllCollateralLocked}`}>
                <Locked warned={isLockWarning} pos={pos} heightened={heightenBars}>
                  <MetaData as="dl" style={{ textAlign: 'right' }}>
                    <Tooltip
                      text={t`You can't withdraw any collateral if you go beyond this threshold.`}
                      show={show}
                      placement="top-end"
                      forcePlacement={true}
                    >
                      <dt>
                        <Trans>All collateral locked</Trans>
                      </dt>
                    </Tooltip>
                    <dd>${lockThresholdPrice.dp(collateralType === 'sICX' ? 3 : 0).toFormat()}</dd>
                  </MetaData>
                </Locked>
                <Liquidated heightened={heightenBars}>
                  <MetaData as="dl">
                    <dt>
                      <Trans>Liquidated</Trans>
                    </dt>
                    <dd>${liquidationThresholdPrice.dp(collateralType === 'sICX' ? 3 : 0).toFormat()}</dd>
                  </MetaData>
                </Liquidated>

                <Nouislider
                  disabled={true}
                  id="slider-risk"
                  direction="rtl"
                  start={[Math.min(currentRatio.toNumber(), 900)]}
                  connect={[true, false]}
                  animate={false}
                  range={{
                    min: [117.7],
                    max: [900],
                  }}
                  instanceRef={instance => {
                    if (instance && !sliderInstance.current) {
                      sliderInstance.current = instance;
                    }
                  }}
                  style={{ height: 16 }}
                />
              </Box>

              <Tooltip
                text={
                  <Typography variant="body">
                    {t`If the ${
                      collateralType === 'sICX' ? 'ICX' : collateralType
                    } price reaches $${liquidationThresholdPrice
                      .dp(collateralType === 'sICX' ? 3 : 0)
                      .toFixed()}, all your collateral will be
                  liquidated.`}
                  </Typography>
                }
                show={show}
                placement="bottom"
                forcePlacement={true}
              >
                <RightChip bg="#fb6a6a" />
              </Tooltip>
            </Flex>

            <Divider my={3} />

            <Flex flexWrap="wrap" mt={-1} flexDirection={['column', 'column', 'column', 'row', 'row']}>
              <Box flex={1} my={2}>
                <Flex alignItems="center" mb={3}>
                  <Typography variant="h3" mr={15} sx={{ position: 'relative' }}>
                    <Trans>Redemptions</Trans>{' '}
                    {shouldShowRebalancingTooltipAnchor && (
                      <QuestionWrapper
                        onClick={openRebalancing}
                        {...(!isIOS ? { onMouseEnter: openRebalancing } : null)}
                        onMouseLeave={closeRebalancing}
                      >
                        <QuestionIcon width={14} style={{ transform: 'translate3d(1px, 1px, 0)' }} />
                      </QuestionWrapper>
                    )}
                    <RebalancingTooltip
                      show={showRebalancing}
                      bottom={false}
                      isActive={shouldShowRebalancingTooltipAnchor}
                    >
                      <TooltipContainer width={340} className="rebalancing-modal">
                        <RebalancingInfo />
                        {shouldShowSeparateTooltip ? null : shouldShowRebalancingAveragePrice ? (
                          <>
                            <br />
                            {averageRebalancingPriceText}
                          </>
                        ) : null}
                      </TooltipContainer>
                    </RebalancingTooltip>
                  </Typography>

                  <ClickAwayListener onClickAway={closeMenu}>
                    <div>
                      <UnderlineTextWithArrow
                        onClick={handleToggle}
                        text={<Trans id={PERIOD_LABELS[period].id} />}
                        arrowRef={arrowRef}
                      />
                      <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                        <MenuList>
                          {PERIODS.map(p => (
                            <MenuItem
                              className={p === 'all' ? 'border-top' : ''}
                              key={p}
                              onClick={() => handlePeriod(p)}
                            >
                              <Trans id={PERIOD_LABELS[p].id} />
                            </MenuItem>
                          ))}
                        </MenuList>
                      </DropdownPopper>
                    </div>
                  </ClickAwayListener>
                </Flex>
                <Flex sx={{ position: 'relative' }}>
                  <Box width={1 / 2}>
                    <Typography variant="p">
                      {formatBigNumber(
                        isHandlingICX ? data?.totalCollateralSold.times(ratio.sICXICXratio) : data?.totalCollateralSold,
                        'currency',
                      )}
                      {` ${isHandlingICX ? 'ICX' : collateralType}`}
                    </Typography>
                    <Typography mt={1} sx={{ position: 'relative' }}>
                      <Trans>Collateral</Trans>
                      <RebalancingTooltipArrow
                        left={25}
                        show={shouldShowSeparateTooltip && shouldShowRebalancingAveragePrice && showRebalancing}
                      />
                    </Typography>
                  </Box>

                  <RebalancingTooltip
                    show={shouldShowSeparateTooltip && shouldShowRebalancingAveragePrice && showRebalancing}
                    bottom={true}
                    isActive={shouldShowRebalancingTooltipAnchor}
                  >
                    <TooltipContainer width={321}>{averageRebalancingPriceText}</TooltipContainer>
                  </RebalancingTooltip>

                  {!upMedium && <VerticalDivider mr={8} />}

                  <Box width={1 / 2}>
                    <Typography variant="p">{formatBigNumber(rebalancingTotal, 'currency')} bnUSD</Typography>
                    <Typography mt={1} sx={{ position: 'relative' }}>
                      <Trans>Loan</Trans>
                      <RebalancingTooltipArrow
                        left={7}
                        show={shouldShowSeparateTooltip && shouldShowRebalancingAveragePrice && showRebalancing}
                      />
                    </Typography>
                  </Box>
                </Flex>
              </Box>

              {upLarge && <VerticalDivider mr={8} mt={3} mb={2} />}

              <Box flex={1} my={2}>
                <Flex alignItems="center" mb={3}>
                  <Typography variant="h3" mr={15}>
                    <Trans>Loan interest</Trans>
                  </Typography>
                </Flex>
                <Flex>
                  <Box width={[1 / 2, 1 / 2, 1 / 2, 4 / 7]}>
                    <Typography variant="p">
                      {interestRate
                        ? `${getAccumulatedInterest(loanInputAmount, interestRate, interestPeriod.days).toFixed(
                            3,
                          )} bnUSD`
                        : '-'}
                    </Typography>
                    <ClickAwayListener onClickAway={closeInterestDropdown}>
                      <div style={{ transform: 'translateY(3px)' }}>
                        <UnderlineTextWithArrow
                          onClick={handleInterestToggle}
                          text={interestPeriod.display + ' ' + t`interest`}
                          arrowRef={arrowRefInterest}
                        />
                        <DropdownPopper show={Boolean(interestAnchor)} anchorEl={interestAnchor} placement="bottom-end">
                          <MenuList>
                            {Object.values(INTEREST_PERIODS).map(p => (
                              <MenuItem key={p.display} onClick={() => handleInterestPeriod(p)}>
                                {p.display}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </DropdownPopper>
                      </div>
                    </ClickAwayListener>
                  </Box>
                  {!upMedium && <VerticalDivider mr={8} />}
                  <Box width={[1 / 2, 1 / 2, 1 / 2, 3 / 7]}>
                    <Typography variant="p" color="white">
                      {interestRate ? `${interestRate.times(100).toFixed(2)}%`.replace('.00%', '%') : '-'}
                    </Typography>
                    <Typography mt={1}>
                      <Trans>Interest rate</Trans>
                    </Typography>
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </BoxPanel>
        </MotionActivityPanel>
      )}
    </AnimatePresence>
  );
};

export default PositionDetailPanel;

export const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: initial;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 0;
  `}

  ${({ theme }) => theme.mediaWidth.upMedium`
    padding: 0;
    grid-column: span 2;
    flex-direction: row;
  `}
`;

const MotionActivityPanel = motion(ActivityPanel);

const Chip = styled(Box)`
  display: inline-block;
  min-width: 90px;
  text-align: center;
  border-radius: 100px;
  padding: 1px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #ffffff;
  line-height: 14px;
  height: 16px;
`;

const LeftChip = styled(Chip)`
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
`;

const RightChip = styled(Chip)`
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  border-left: 1px solid #0d2a4d;
`;

const Threshold = styled(Box)<{ warned?: boolean; heightened?: boolean }>`
  color: ${({ warned }) => (warned ? '#fb6a6a' : '#ffffff')};
  position: absolute;
  bottom: 0;
  width: 1px;
  height: ${({ heightened }) => (heightened ? '70px' : '50px')};
  margin-top: -34px;
  background-color: ${({ warned }) => (warned ? '#fb6a6a' : '#ffffff')};
  z-index: 2;
  transition: color 0.3s ease;

  ::after {
    position: absolute;
    content: '';
    top: 0;
    width: 10px;
    height: 1px;
    margin-left: -10px;
    background-color: ${({ warned }) => (warned ? '#fb6a6a' : '#ffffff')};
    z-index: 2;
    transition: height 0.3s ease;
  }
`;

export const MetaData = styled(Box)`
  font-size: 14px;
  margin-top: -10px;

  & dt {
    line-height: 17px;
  }

  & dd {
    margin-inline: 0px;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
  }
`;

const Locked = styled(Threshold)<{ pos: number }>`
  left: ${({ pos }) => (1 - pos) * 100}%;
  transition: left ease 0.5s;

  ${MetaData} {
    width: 155px;
    margin-left: -170px;

    ${({ theme }) => theme.mediaWidth.up360`
    
    width: 220px;
    margin-left: -235px;
  `};
  }
`;

const Liquidated = styled(Threshold)`
  left: 100%;

  ::after {
    margin-left: 0;
  }

  ${MetaData} {
    width: 110px;
    padding-left: 15px;
  }
`;

const VerticalDivider = styled(Box)`
  width: 1px;
  height: initial;
  background-color: ${({ theme }) => theme.colors.divider};
`;

const RebalancingTooltipArrow = styled.span<{ left: number; show: boolean }>`
  position: absolute;
  display: inline-block;
  transition: all ease 0.25s;
  transform: translateY(3px);
  left: 0;
  bottom: 0;
  opacity: ${({ show }) => (show ? 1 : 0)};

  &:before {
    content: '';
    left: ${({ left }) => `${left}px`};
    position: absolute;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 10px solid ${({ theme }) => theme.colors.primary};
    display: inline-block;
  }
`;

const RebalancingTooltip = styled.div<{ show: boolean; bottom?: boolean; isActive: boolean }>`
  background: ${({ theme }) => theme.colors.bg4};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text1};
  border-radius: 8px;
  position: absolute;
  ${({ bottom }) => (bottom ? `top: calc(100% + 12px)` : `bottom: calc(100% + 5px)`)};
  left: ${({ bottom }) => (bottom ? `50%` : `100%`)};
  margin-left: ${({ bottom }) => (bottom ? `-160px` : `-225px`)};
  z-index: 10;
  transition: all ease 0.25s;
  opacity: ${({ show }) => (show ? 1 : 0)};
  pointer-events: ${({ show }) => (show ? 'all' : 'none')};
  display: ${({ isActive }) => (isActive ? 'block' : 'none')};

  &:before {
    ${({ bottom }) => (bottom ? null : `content: ''`)};
    left: 50%;
    top: calc(100% + 1px);
    margin-left: -10px;
    position: absolute;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 10px solid ${({ theme }) => theme.colors.primary};
    display: inline-block;
  }

  ${({ theme }) => theme.mediaWidth.up360`
     margin-left: -170px;

    &:before {
      margin-left: -14px;
    }
  `};

  ${({ theme }) => theme.mediaWidth.up500`
    margin-left: -173px;
    
    &:before {
      margin-left: -14px;
    }
  `};

  ${({ theme }) => theme.mediaWidth.upMedium`
    margin-left: -178px;

    &:before {
      margin-left: -9px;
    }
  `};

  ${({ theme }) => theme.mediaWidth.upLarge`
    ${({ bottom }) => (bottom ? `top: calc(100% + 12px)` : `bottom: calc(100% + 5px)`)};
    left: ${({ bottom }) => (bottom ? `50%` : `100%`)};
    margin-left: ${({ bottom }) => (bottom ? `-160px` : `-178px`)};

    &:before {
      margin-left: -9px;
    }
  `};
`;
