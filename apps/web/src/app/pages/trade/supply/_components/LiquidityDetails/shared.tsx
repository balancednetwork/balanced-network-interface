import { BoxPanel } from '@/app/components/Panel';
import { Typography } from '@/app/theme';
import ArrowDownIcon from '@/assets/icons/arrow-line.svg';
import { MINIMUM_B_BALANCE_TO_SHOW_POOL } from '@/constants/index';
import { BIGINT_ZERO } from '@/constants/misc';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { omit } from 'lodash-es';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';
import { usePoolPanelContext } from '../PoolPanelContext';

export const useHasLiquidity = (): boolean => {
  // fetch the reserves for all V2 pools
  const { pairs, balances } = usePoolPanelContext();

  const queuePair = pairs[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueBalance = balances[BalancedJs.utils.POOL_IDS.sICXICX];

  const shouldShowQueue =
    queuePair &&
    queueBalance &&
    (queueBalance.balance.quotient > BIGINT_ZERO ||
      (queueBalance.balance1 && queueBalance.balance1.quotient > BIGINT_ZERO));

  const pairsWithoutQ = omit(pairs, [BalancedJs.utils.POOL_IDS.sICXICX]);
  const userPools = Object.keys(pairsWithoutQ).filter(
    poolId =>
      balances[poolId] &&
      (Number(balances[poolId].balance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL ||
        Number(balances[poolId].stakedLPBalance.toFixed()) > MINIMUM_B_BALANCE_TO_SHOW_POOL),
  );

  return !!shouldShowQueue || !!userPools.length;
};

export const StyledBoxPanel = styled(BoxPanel)`
  display: flex;
  margin-bottom: 20px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upSmall`
     flex-direction: row;
  `}
`;

export const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 4fr 5fr;
  gap: 10px;
  grid-template-areas: 'name supply action';
  align-items: center;

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }

  ${({ theme }) => theme.mediaWidth.upSmall`
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-areas: 'name supply share rewards action';
  `}
`;

export const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
  display: flex;
  gap: 5px;
  align-items: center;
`;

export const DataText = styled(Flex)`
  font-size: 16px;
  justify-content: center;
  align-items: end;
  flex-direction: column;
`;

export const StyledArrowDownIcon = styled(ArrowDownIcon)`
  width: 10px;
  margin-left: 10px;
  margin-top: 10px;
  transition: transform 0.3s ease;
`;

export const StyledDataText = styled(Flex)`
  font-weight: bold;
`;

export const ListItem = styled(DashGrid)`
  padding: 20px 0;
  color: #ffffff;
`;

export const APYItem = styled(Flex)`
  align-items: flex-end;
  line-height: 25px;
`;
