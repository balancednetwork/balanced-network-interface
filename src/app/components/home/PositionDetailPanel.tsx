import React from 'react';

import BigNumber from 'bignumber.js';
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
import Tooltip, { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import {
  SAFETY_COLLATERAL_RATIO,
  MANDATORY_COLLATERAL_RATIO,
  LIQUIDATION_COLLATERAL_RATIO,
  ZERO,
} from 'constants/index';
import { useRebalancingDataQuery, Period } from 'queries/rebalancing';
import { useCollateralInputAmount, useCollateralInputAmountInUSD } from 'store/collateral/hooks';
import { useLoanInputAmount, useLoanDebtHoldingShare, useLoanAPY } from 'store/loan/hooks';
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
      loanInputAmount.div(collateralInputAmount).times(SAFETY_COLLATERAL_RATIO),
      loanInputAmount.div(collateralInputAmount).times(MANDATORY_COLLATERAL_RATIO),
      loanInputAmount.div(collateralInputAmount).times(LIQUIDATION_COLLATERAL_RATIO),
    ];
  }, [collateralInputAmount, loanInputAmount]);
};

const useOwnDailyRewards = (): BigNumber => {
  const debtHoldShare = useLoanDebtHoldingShare();

  const rewards = useRewards();

  const totalDailyRewards = rewards['Loans'] || ZERO;

  return totalDailyRewards.times(debtHoldShare).div(100);
};

const displayPeriod: { [key: string]: string } = {
  day: 'Past day',
  week: 'Past week',
  month: 'Past month',
  all: 'All time',
};

const PERIODS: Period[] = [Period.day, Period.week, Period.month, Period.all];

const PositionDetailPanel = () => {
  const dailyRewards = useOwnDailyRewards();
  const rewardsAPY = useLoanAPY();
  const hasRewardableCollateral = useHasRewardableLoan();
  const upLarge = useMedia('(min-width: 1200px)');
  const smallSp = useMedia('(max-width: 360px)');
  const [show, setShow] = React.useState<boolean>(false);
  const [period, setPeriod] = React.useState<Period>(Period.day);

  const open = React.useCallback(() => setShow(true), [setShow]);
  const close = React.useCallback(() => setShow(false), [setShow]);

  // ratio
  const ratio = useRatio();

  // Rebalancing section
  const { data } = useRebalancingDataQuery(period);

  // loan
  const loanInputAmount = useLoanInputAmount();

  const collateralInputAmountInUSD = useCollateralInputAmountInUSD();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  const [, lockThresholdPrice, liquidationThresholdPrice] = useThresholdPrices();

  const currentRatio = useCurrentCollateralRatio();
  var lowRisk1 = (900 * 100) / currentRatio.toNumber();

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

  const handlePeriod = (p: Period) => {
    closeMenu();
    setPeriod(p);
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
          The current ICX price is <span className="white">${ratio.ICXUSDratio.dp(4).toFormat()}</span>.
        </Typography>
        <Typography mb={2}>
          You will be liquidated at <span className="white">${liquidationThresholdPrice.dp(3).toFormat()}</span>.
        </Typography>
      </BoxPanel>

      <BoxPanel bg="bg2" flex={1}>
        <Typography variant="h3">
          Risk ratio{' '}
          {!smallSp && (
            <QuestionWrapper onClick={open} {...(!isIOS ? { onMouseEnter: open } : null)} onMouseLeave={close}>
              <QuestionIcon width={14} style={{ marginTop: -5 }} />
            </QuestionWrapper>
          )}
        </Typography>

        <Flex alignItems="center" justifyContent="space-between" mt={[10, 10, 10, 10, 5]} mb={4}>
          <Tooltip
            text="If the bar only fills this section, you have a low risk of liquidation."
            show={show}
            placement="bottom"
            small
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
            <Locked warned={isLockWarning}>
              <MetaData as="dl" style={{ textAlign: 'right' }}>
                <Tooltip
                  text="You can’t withdraw any collateral if you go beyond this threshold."
                  show={show}
                  placement="top-end"
                  small
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
            small
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
                    'If bnUSD is 5% above or below $1, some of your collateral may be sold and a larger amount of debt repaid to rebalance the price.'
                  }
                  placement="top"
                >
                  {!smallSp && <QuestionIcon width={14} color="text1" style={{ marginTop: -5, color: '#D5D7DB' }} />}
                </MouseoverTooltip>
              </Typography>

              <ClickAwayListener onClickAway={closeMenu}>
                <div>
                  <UnderlineTextWithArrow onClick={handleToggle} text={displayPeriod[period]} arrowRef={arrowRef} />
                  <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                    <MenuList>
                      {PERIODS.map(p => (
                        <MenuItem className={p === 'all' ? 'border-top' : ''} key={p} onClick={() => handlePeriod(p)}>
                          {displayPeriod[p]}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </DropdownPopper>
                </div>
              </ClickAwayListener>
            </Flex>
            <Flex>
              <Box width={1 / 2}>
                <Typography variant="p">{formatBigNumber(data?.totalCollateralSold, 'currency')} ICX</Typography>
                <Typography mt={1}>Collateral sold</Typography>
              </Box>
              <Box width={1 / 2}>
                <Typography variant="p">{formatBigNumber(data?.totalRepaid, 'currency')} bnUSD</Typography>
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
    color: rgba(255, 255, 255, 0.75);
  }
`;

const Locked = styled(Threshold)`
  left: 81.905%;

  ${MetaData} {
    width: 150px;
    margin-left: -165px;
  }
`;

const VerticalDivider = styled(Box)`
  width: 1px;
  height: initial;
  background-color: ${({ theme }) => theme.colors.divider};
`;
