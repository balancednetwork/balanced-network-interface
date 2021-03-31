import React from 'react';

import Nouislider from 'nouislider-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Divider from 'app/components/Divider';
import DropdownText from 'app/components/DropdownText';
import { MenuList, MenuItem } from 'app/components/Menu';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { QuestionWrapper } from 'app/components/QuestionHelper';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import { useCollateralInputAmount } from 'store/collateral/hooks';
import {
  useLoanbnUSDbadDebt,
  useLoanbnUSDtotalSupply,
  useLoanInputAmount,
  useTotalAvailablebnUSDAmount,
} from 'store/loan/hooks';
import { useRatioValue } from 'store/ratio/hooks';

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: 2 / 1 / 2 / 3;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
    flex-direction: column;
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
  height: 17px;
`;

const Threshold = styled(Box)`
  position: absolute;
  width: 1px;
  height: 50px;
  margin-top: -33px;
  background-color: #ffffff;
  z-index: 2;
  transition: color 0.3s ease;

  ::after {
    position: absolute;
    content: '';
    top: 0;
    width: 10px;
    height: 1px;
    margin-left: -10px;
    background-color: #ffffff;
    z-index: 2;
    transition: height 0.3s ease;
  }
`;

const MetaData = styled(Box)`
  font-size: 14px;
  margin-top: -10px;
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

const useThresholdPrices = () => {
  const collateralInputAmount = useCollateralInputAmount();
  const loanInputAmount = useLoanInputAmount();

  return React.useMemo(() => {
    if (collateralInputAmount.isZero()) return [0, 0];

    return [
      loanInputAmount.multipliedBy(5).div(collateralInputAmount),
      loanInputAmount.multipliedBy(4).div(collateralInputAmount),
    ];
  }, [collateralInputAmount, loanInputAmount]);
};

const useCurrentRatio = () => {
  const collateralInputAmount = useCollateralInputAmount();
  const loanInputAmount = useLoanInputAmount();
  const ratio = useRatioValue();

  return React.useMemo(() => {
    if (loanInputAmount.isZero()) return 900;

    return collateralInputAmount
      .multipliedBy(ratio.ICXUSDratio)
      .dividedBy(loanInputAmount)
      .multipliedBy(100)
      .toNumber();
  }, [collateralInputAmount, loanInputAmount, ratio.ICXUSDratio]);
};

const useTotalCollateralAmountbyUSD = () => {
  const collateralInputAmount = useCollateralInputAmount();
  const ratio = useRatioValue();

  return React.useMemo(() => {
    return collateralInputAmount.multipliedBy(ratio.ICXUSDratio);
  }, [collateralInputAmount, ratio.ICXUSDratio]);
};

const useDebtHoldingShare = () => {
  const loanInputAmount = useLoanInputAmount();
  const loanbnUSDbadDebt = useLoanbnUSDbadDebt();
  const loanbnUSDtotalSupply = useLoanbnUSDtotalSupply();

  return React.useMemo(() => {
    return loanInputAmount.div(loanbnUSDtotalSupply.minus(loanbnUSDbadDebt)).multipliedBy(100);
  }, [loanInputAmount, loanbnUSDbadDebt, loanbnUSDtotalSupply]);
};

const PositionDetailPanel = () => {
  const [show, setShow] = React.useState<boolean>(false);

  const open = React.useCallback(() => setShow(true), [setShow]);
  const close = React.useCallback(() => setShow(false), [setShow]);

  // ratio
  const ratio = useRatioValue();

  // loan
  const loanInputAmount = useLoanInputAmount();
  const totalAvailableLoanAmount = useTotalAvailablebnUSDAmount();

  const totalCollateralAmountbyUSD = useTotalCollateralAmountbyUSD();

  const debtHoldShare = useDebtHoldingShare();

  // collateral slider instance
  const sliderInstance = React.useRef<any>(null);

  const [rewardThresholdPrice, lockThresholdPrice] = useThresholdPrices();

  const currentRatio = useCurrentRatio();

  var lowRisk1 = (900 * 100) / currentRatio;

  if (loanInputAmount.isNegative() || loanInputAmount.isZero()) {
    return null;
  }

  return (
    <ActivityPanel bg="bg2">
      <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 'initial', 350]}>
        <Typography variant="h2" mb={5}>
          Position detail
        </Typography>

        <Flex>
          <Box width={1 / 2}>
            <Typography mb={1}>Collateral</Typography>
            <Typography variant="p" fontSize={18}>
              ${totalCollateralAmountbyUSD.toFixed(2)}
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography mb={1}>Loan</Typography>

            <Typography variant="p" fontSize={18} as="span">
              ${loanInputAmount.toFixed(2)} <Typography as="span">/ ${totalAvailableLoanAmount.toFixed(2)}</Typography>
            </Typography>
          </Box>
        </Flex>
        <Divider my={4} />
        <Typography mb={2}>
          The current ICX price is <span className="alert">{'$' + ratio.ICXUSDratio.toFixed(2)}</span>.
        </Typography>
        <Typography>
          You hold{' '}
          <span className="white">{isNaN(debtHoldShare.toNumber()) ? '-' : debtHoldShare.toFixed(2) + '%'}</span> of the
          total debt.
        </Typography>
      </BoxPanel>
      <BoxPanel bg="bg2" flex={1}>
        <Typography variant="h3">
          Risk ratio{' '}
          <QuestionWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
            <QuestionIcon width={14} />
          </QuestionWrapper>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between" my={4}>
          <Tooltip
            text="If the bar only fills this section, you have a low risk of liquidation."
            show={show}
            placement="bottom"
          >
            <Chip
              bg="primary"
              style={{
                backgroundImage: 'linear-gradient(to right, #2ca9b7 ' + lowRisk1 + '%, #144a68 ' + lowRisk1 + '%)',
              }}
            >
              Low risk
            </Chip>
          </Tooltip>

          <Box flex={1} mx={1} style={{ position: 'relative', marginTop: '3px' }}>
            <Rewards>
              <MetaData as="dl">
                <Tooltip
                  text="You won’t earn any Balance Tokens if you go beyond this threshold."
                  show={show}
                  placement="top-end"
                >
                  <dt>Reward threshold</dt>
                </Tooltip>
                <dd>${rewardThresholdPrice.toFixed(3)}</dd>
              </MetaData>
            </Rewards>

            <Locked>
              <MetaData as="dl">
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
              start={[Math.min(currentRatio, 900)]}
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
            />
          </Box>

          <Tooltip
            text="If the ICX price reaches $0.8618, your collateral will be liquidated."
            show={show}
            placement="bottom"
          >
            <Chip bg="red">Liquidated</Chip>
          </Tooltip>
        </Flex>

        <Divider my={3} />

        <Flex flexWrap="wrap" alignItems="flex-end">
          <Box width={[1, 1 / 2]}>
            <Flex alignItems="center" mb={15}>
              <Typography variant="h3" mr={15}>
                Rebalancing
              </Typography>
              <DropdownText text="Past week">
                <MenuList>
                  <MenuItem>Day</MenuItem>
                  <MenuItem>Week</MenuItem>
                  <MenuItem>Month</MenuItem>
                </MenuList>
              </DropdownText>
            </Flex>
            <Flex>
              <Box width={1 / 2}>
                <Typography variant="p">0 ICX</Typography>
                <Typography>Collateral sold</Typography>
              </Box>
              <Box width={1 / 2}>
                <Typography variant="p">0 bnUSD</Typography>
                <Typography>Loan repaid</Typography>
              </Box>
            </Flex>
          </Box>

          <Box width={[1, 1 / 2]}>
            <Typography>
              Traders can repay loans by selling bnUSD for $1 of ICX collateral. Your position will rebalance based on
              your % of the total debt.
            </Typography>
          </Box>
        </Flex>
      </BoxPanel>
    </ActivityPanel>
  );
};

export default PositionDetailPanel;
