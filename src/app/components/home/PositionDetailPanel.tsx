import React from 'react';

import BigNumber from 'bignumber.js';
import { timeStamp } from 'console';
import dayjs from 'dayjs';
import Nouislider from 'nouislider-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Divider from 'app/components/Divider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { QuestionWrapper } from 'app/components/QuestionHelper';
import Tooltip, { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import {
  REWARDS_COLLATERAL_RATIO,
  MANDATORY_COLLATERAL_RATIO,
  LIQUIDATION_COLLATERAL_RATIO,
  ZERO,
} from 'constants/index';
import { useCollateralInputAmount, useCollateralInputAmountInUSD } from 'store/collateral/hooks';
import {
  useLoanInputAmount,
  useLoanDebtHoldingShare,
  useLoanTotalRepaid,
  useLoanFetchTotalRepaid,
  useLoanTotalCollateralSold,
  useLoanAPY,
} from 'store/loan/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useHasRewardableLoan, useRewards, useCurrentCollateralRatio } from 'store/reward/hooks';
import { formatBigNumber } from 'utils';

import { DropdownPopper } from '../Popover';

const useThresholdPrices = (): [BigNumber, BigNumber, BigNumber] => {
  const collateralInputAmount = useCollateralInputAmount();
  const loanInputAmount = useLoanInputAmount();

  return React.useMemo(() => {
    if (collateralInputAmount.isZero()) return [new BigNumber(0), new BigNumber(0), new BigNumber(0)];

    return [
      loanInputAmount.multipliedBy(REWARDS_COLLATERAL_RATIO).div(collateralInputAmount),
      loanInputAmount.multipliedBy(MANDATORY_COLLATERAL_RATIO).div(collateralInputAmount),
      loanInputAmount.multipliedBy(LIQUIDATION_COLLATERAL_RATIO).div(collateralInputAmount),
    ];
  }, [collateralInputAmount, loanInputAmount]);
};

const useOwnDailyRewards = (): BigNumber => {
  const debtHoldShare = useLoanDebtHoldingShare();

  const rewards = useRewards();

  const totalDailyRewards = rewards['Loans'] || ZERO;

  return totalDailyRewards.times(debtHoldShare).div(100);
};

enum Period {
  'day' = 'Day',
  'week' = 'Week',
  'month' = 'Month',
  'all' = 'All time',
}

const PERIODS = [Period.day, Period.week, Period.month];

const PositionDetailPanel = () => {
  const dailyRewards = useOwnDailyRewards();
  const rewardsAPY = useLoanAPY();
  const hasRewardableCollateral = useHasRewardableLoan();
  const upLarge = useMedia('(min-width: 1200px)');
  const [show, setShow] = React.useState<boolean>(false);

  const open = React.useCallback(() => setShow(true), [setShow]);
  const close = React.useCallback(() => setShow(false), [setShow]);

  // ratio
  const ratio = useRatio();

  // Rebalancing section
  const loanTotalRepaid = useLoanTotalRepaid();
  const collateralTotalSold = useLoanTotalCollateralSold();
  const updateLoanTotalRepaid = useLoanFetchTotalRepaid();

  React.useEffect(() => {
    updateLoanTotalRepaid(dayjs().subtract(1, 'day').unix());
  }, [updateLoanTotalRepaid]);

  // loan
  const loanInputAmount = useLoanInputAmount();

  const collateralInputAmountInUSD = useCollateralInputAmountInUSD();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  const [rewardThresholdPrice, lockThresholdPrice, liquidationThresholdPrice] = useThresholdPrices();

  const currentRatio = useCurrentCollateralRatio();
  var lowRisk1 = (900 * 100) / currentRatio.toNumber();

  const isRewardWarning = rewardThresholdPrice.minus(ratio.ICXUSDratio).isGreaterThanOrEqualTo(0);

  const isLockWarning = lockThresholdPrice.minus(ratio.ICXUSDratio).isGreaterThan(-0.01);

  const isPassAllCollateralLocked = ratio.ICXUSDratio.isLessThan(lockThresholdPrice);

  // handle rebalancing logic
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeMenu = () => {
    setAnchor(null);
  };

  const [period, setPeriod] = React.useState(Period.day);

  const handlePeriod = (p: Period) => {
    closeMenu();
    setPeriod(p);

    let timestamp = 0; // all
    switch (p) {
      case Period.day:
        timestamp = dayjs().subtract(1, 'day').unix();
        break;
      case Period.week:
        timestamp = dayjs().subtract(1, 'week').unix();
        break;
      case Period.month:
        timestamp = dayjs().subtract(1, 'month').unix();
        break;
      default:
    }
    updateLoanTotalRepaid(timestamp);
  };

  if (loanInputAmount.isNegative() || loanInputAmount.isZero()) {
    return null;
  }

  return (
    <ActivityPanel bg="bg2">
      <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 'initial', 'initial', 350]}>
        <Typography variant="h2" mb={5}>
          Position details
        </Typography>

        <Flex>
          <Box flex={1}>
            <Typography mb={1}>Collateral</Typography>
            <Typography variant="p" fontSize={18}>
              ${collateralInputAmountInUSD.dp(2).toFormat()}
            </Typography>
          </Box>

          <VerticalDivider mr={8} />

          <Box flex={1}>
            <Typography mb={1}>Loan</Typography>
            <Typography variant="p" fontSize={18} as="span">
              ${loanInputAmount.dp(2).toFormat()}
            </Typography>
          </Box>
        </Flex>
        <Divider my={4} />
        <Typography mb={2}>
          The current ICX price is{' '}
          <span className={isRewardWarning ? 'alert' : 'white'}>${ratio.ICXUSDratio.dp(4).toFormat()}</span>.
        </Typography>
        <Typography mb={2}>
          You will be liquidated at <span className="white">${liquidationThresholdPrice.dp(3).toFormat()}</span>.
        </Typography>
      </BoxPanel>

      <BoxPanel bg="bg2" flex={1}>
        <Typography variant="h3">
          Risk ratio{' '}
          <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
            <QuestionIcon width={14} style={{ marginTop: -5 }} />
          </QuestionWrapper>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between" mt={[10, 10, 10, 10, 5]} mb={4}>
          <Tooltip
            text="If the bar only fills this section, you have a low risk of liquidation."
            show={show}
            placement="bottom"
          >
            <LeftChip
              bg="primary"
              style={{
                background: isPassAllCollateralLocked
                  ? '#fb6a6a'
                  : 'linear-gradient(to right, #2ca9b7 ' + lowRisk1 + '%, #144a68 ' + lowRisk1 + '%)',
              }}
            >
              Low risk
            </LeftChip>
          </Tooltip>

          <Box flex={1} style={{ position: 'relative' }}>
            <Rewards warned={isRewardWarning}>
              <MetaData as="dl" style={{ textAlign: 'right' }}>
                <Tooltip
                  text="You won’t earn any Balance Tokens if you go beyond this threshold."
                  show={show}
                  placement="top-end"
                >
                  <dt>Reward threshold</dt>
                </Tooltip>
                <dd>${rewardThresholdPrice.toFixed(4)}</dd>
              </MetaData>
            </Rewards>

            <Locked warned={isLockWarning}>
              <MetaData as="dl" style={{ textAlign: 'left' }}>
                <Tooltip
                  text="You can’t withdraw any collateral if you go beyond this threshold."
                  show={show}
                  placement="top-start"
                >
                  <dt>All collateral locked</dt>
                </Tooltip>
                <dd>${lockThresholdPrice.toFixed(3)}</dd>
              </MetaData>
            </Locked>

            <Nouislider
              disabled={true}
              id="slider-risk"
              direction="rtl"
              start={[Math.min(currentRatio.toNumber(), 900)]}
              connect={[true, false]}
              range={{
                min: [150],
                max: [900],
              }}
              instanceRef={instance => {
                if (instance && !sliderInstance.current) {
                  sliderInstance.current = instance;
                }
              }}
              style={{ height: 16, backgroundColor: isPassAllCollateralLocked ? '#fb6a6a' : '' }}
            />
          </Box>

          <Tooltip
            text={`If the ICX price reaches $${liquidationThresholdPrice.toFixed(3)}, 
                    your collateral will be liquidated.`}
            show={show}
            placement="bottom"
          >
            <RightChip bg="#fb6a6a">Liquidated</RightChip>
          </Tooltip>
        </Flex>

        <Divider my={3} />

        <Flex flexWrap="wrap" mt={-1} flexDirection={['column', 'column', 'column', 'row', 'row']}>
          <Box flex={1} my={2}>
            <Flex alignItems="center" mb={3}>
              <Typography variant="h3" mr={15}>
                Rebalancing{' '}
                <MouseoverTooltip
                  text={
                    'Traders can repay loans by selling bnUSD for $1 of ICX collateral. Your position will sometimes rebalance to accommodate.'
                  }
                  placement="top"
                >
                  <QuestionIcon width={14} color="text1" style={{ marginTop: -5, color: '#D5D7DB' }} />
                </MouseoverTooltip>
              </Typography>

              <ClickAwayListener onClickAway={closeMenu}>
                <div>
                  <UnderlineTextWithArrow
                    onClick={handleToggle}
                    text={period === Period.all ? Period.all : `Past ${period.toLowerCase()}`}
                    arrowRef={arrowRef}
                  />
                  <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                    <MenuList>
                      {PERIODS.map(p => (
                        <MenuItem key={p} onClick={() => handlePeriod(p)}>
                          {p}
                        </MenuItem>
                      ))}
                      <MenuItem
                        style={{
                          borderTop: `0.5px solid rgba(255, 255, 255, 0.15)`,
                        }}
                        onClick={() => handlePeriod(Period.all)}
                      >
                        {Period.all}
                      </MenuItem>
                    </MenuList>
                  </DropdownPopper>
                </div>
              </ClickAwayListener>
            </Flex>
            <Flex>
              <Box width={1 / 2}>
                <Typography variant="p">{formatBigNumber(collateralTotalSold, 'currency')} ICX</Typography>
                <Typography mt={1}>Collateral sold</Typography>
              </Box>
              <Box width={1 / 2}>
                <Typography variant="p">{formatBigNumber(loanTotalRepaid, 'currency')} bnUSD</Typography>
                <Typography mt={1}>Loan repaid</Typography>
              </Box>
            </Flex>
          </Box>

          {upLarge && <VerticalDivider mr={8} mt={3} mb={2} />}

          <Box flex={1} my={2}>
            <Flex alignItems="center" mb={3}>
              <Typography variant="h3" mr={15}>
                Expected return
              </Typography>
            </Flex>
            <Flex>
              <Box width={1 / 2}>
                <Typography variant="p">
                  {hasRewardableCollateral ? `~ ${dailyRewards.dp(2).toFormat()} BALN` : '-'}
                </Typography>
                <Typography mt={1}>Daily rewards</Typography>
              </Box>
              <Box width={1 / 2}>
                <Typography variant="p" color={hasRewardableCollateral ? 'white' : 'alert'}>
                  {rewardsAPY ? rewardsAPY.times(100).dp(2).toFormat() : '-'}%
                </Typography>
                <Typography mt={1}>APY</Typography>
              </Box>
            </Flex>
          </Box>
        </Flex>
      </BoxPanel>
    </ActivityPanel>
  );
};

export default PositionDetailPanel;

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: initial;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 0;
  `}

  ${({ theme }) => theme.mediaWidth.upMedium`
    padding: 0;
    grid-area: 2 / 1 / 2 / 3;
    flex-direction: row;
  `}
`;

const Chip = styled(Box)`
  display: inline-block;
  min-width: 82px;
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
  border-right: 3px solid #0d2a4d;
`;

const RightChip = styled(Chip)`
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  border-left: 3px solid #0d2a4d;
`;

const Threshold = styled(Box)<{ warned?: boolean }>`
  color: ${({ warned }) => (warned ? '#fb6a6a' : '#ffffff')};
  position: absolute;
  width: 1px;
  height: 50px;
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

const MetaData = styled(Box)`
  font-size: 14px;
  margin-top: -10px;

  & dt {
    line-height: 17px;
  }

  & dd {
    margin-inline: 0px;
  }
`;

const Rewards = styled(Threshold)`
  left: 53.2%;
  /* text-align: right; */

  ${MetaData} {
    width: 125px;
    margin-left: -140px;
  }
`;

const Locked = styled(Threshold)`
  left: 66.5%;

  ::after {
    margin-left: initial;
  }

  ${MetaData} {
    width: 150px;
    margin-left: 15px;
  }
`;

const VerticalDivider = styled(Box)`
  width: 1px;
  height: initial;
  background-color: ${({ theme }) => theme.colors.divider};
`;
