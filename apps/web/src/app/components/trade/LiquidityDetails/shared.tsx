import { BalancedJs } from '@balancednetwork/balanced-js';
import JSBI from 'jsbi';
import { omit } from 'lodash-es';
import styled from 'styled-components';

import { BoxPanel } from 'app/components/Panel';
import { MINIMUM_B_BALANCE_TO_SHOW_POOL } from 'constants/index';
import { BIGINT_ZERO } from 'constants/misc';

import { usePoolPanelContext } from '../PoolPanelContext';

export const useHasLiquidity = (): boolean => {
  // fetch the reserves for all V2 pools
  const { pairs, balances } = usePoolPanelContext();

  const queuePair = pairs[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueBalance = balances[BalancedJs.utils.POOL_IDS.sICXICX];

  const shouldShowQueue =
    queuePair &&
    queueBalance &&
    (JSBI.greaterThan(queueBalance.balance.quotient, BIGINT_ZERO) ||
      (queueBalance.balance1 && JSBI.greaterThan(queueBalance.balance1.quotient, BIGINT_ZERO)));

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
