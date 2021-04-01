import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import styled from 'styled-components';

import { Wrapper, UnderlineText, StyledArrowDownIcon } from 'app/components/DropdownText';
import { List, ListItem, DashGrid, HeaderText, DataText } from 'app/components/List';
import { PopperWithoutArrow } from 'app/components/Popover';
import { SupportedPairs, Pair } from 'constants/currency';
import { useLiquiditySupply } from 'store/liquidity/hooks';
import { useSetPair, usePoolPair } from 'store/pool/hooks';
import { useRatioValue } from 'store/ratio/hooks';
import { useReward } from 'store/reward/hooks';

const StyledWrapper = styled(Wrapper)`
  font-size: 18px;
  padding-bottom: 5px;
  color: white;
  :hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function LiquiditySelect() {
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const ref = React.useRef<HTMLElement>(null);

  const selectedPair = usePoolPair();
  const setPair = useSetPair();

  const handleSelectPool = (pl: Pair) => {
    toggleOpen();
    setPair(pl);
  };

  const pairs = [SupportedPairs[0], SupportedPairs[1], SupportedPairs[2]];

  const poolReward = useReward();
  const ratio = useRatioValue();
  const liquidity = useLiquiditySupply();

  const sICXICXpoolDailyReward =
    (poolReward.sICXICXreward?.toNumber() || 0) * (poolReward.poolDailyReward?.toNumber() || 0);
  const sICXbnUSDpoolDailyReward =
    (poolReward.sICXbnUSDreward?.toNumber() || 0) * (poolReward.poolDailyReward?.toNumber() || 0);
  const BALNbnUSDpoolDailyReward =
    (poolReward.BALNbnUSDreward?.toNumber() || 0) * (poolReward.poolDailyReward?.toNumber() || 0);

  const sICXICXapy =
    (sICXICXpoolDailyReward * 365 * ratio.BALNbnUSDratio?.toNumber()) /
      ((liquidity.sICXICXTotalSupply?.toNumber() || 0) * ratio.ICXUSDratio?.toNumber()) || 0;

  const sICXbnUSDICXapy =
    (sICXbnUSDpoolDailyReward * 365 * ratio.BALNbnUSDratio?.toNumber()) /
      ((liquidity.sICXSuppliedPoolsICXbnUSD?.toNumber() || 0) * ratio.sICXbnUSDratio?.toNumber() +
        (liquidity.bnUSDPoolsICXbnUSDTotal?.toNumber() || 0)) || 0;

  const BALNbnUSDapy =
    (BALNbnUSDpoolDailyReward * 365 * ratio.BALNbnUSDratio?.toNumber()) /
      ((liquidity.BALNPoolBALNbnUSDTotal?.toNumber() || 0) * ratio.BALNbnUSDratio?.toNumber() +
        (liquidity.bnUSDPoolBALNbnUSDTotal?.toNumber() || 0)) || 0;

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div>
        <StyledWrapper ref={ref} onClick={toggleOpen}>
          <UnderlineText>{selectedPair.pair}</UnderlineText>
          <StyledArrowDownIcon />
        </StyledWrapper>

        <PopperWithoutArrow show={open} anchorEl={ref.current} placement="bottom">
          <List>
            <DashGrid>
              <HeaderText>POOL</HeaderText>
              <HeaderText textAlign="right">APY</HeaderText>
            </DashGrid>
            {pairs.map(pool => (
              <ListItem key={pool.pair} onClick={() => handleSelectPool(pool)}>
                <DataText variant="p" fontWeight="bold">
                  {pool.pair}
                </DataText>
                <DataText variant="p" textAlign="right">
                  {pool.pair === 'sICX / bnUSD'
                    ? sICXbnUSDICXapy
                    : pool.pair === 'BALN / bnUSD'
                    ? BALNbnUSDapy
                    : pool.pair === 'ICX / sICX'
                    ? sICXICXapy
                    : ''}{' '}
                  %
                </DataText>
              </ListItem>
            ))}
          </List>
        </PopperWithoutArrow>
      </div>
    </ClickAwayListener>
  );
}
