import { StyledArrowDownIcon } from '@/app/components/DropdownText';
import { DropdownPopper } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import { calculateTotal, useLPRewards, useRatesWithOracle } from '@/queries/reward';
import { useUnclaimedFees } from '@/store/fees/hooks';
import { useSavingsActionHandlers, useSavingsXChainId, useUnclaimedRewards } from '@/store/savings/hooks';
import { XChain, xChainMap, xChains } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import React, { useEffect, useMemo } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import styled from 'styled-components';
import ChainList from './ChainList';
import ChainSelectorLogo from './ChainSelectorLogo';

export const SelectorWrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};

  @-moz-document url-prefix() {
    img {
      transform: translate3d(0, -3px, 0)
    }
    svg {
      position: relative;
      top: -3px;
    }
  }
`;

const SavingsChainSelector = ({
  width,
  containerRef,
}: { width: number | undefined; containerRef: HTMLDivElement | null }) => {
  const [isOpen, setOpen] = React.useState(false);
  const savingsXChainId = useSavingsXChainId();
  const { onSavingsXChainSelection } = useSavingsActionHandlers();

  const { data: lpRewards } = useLPRewards();
  const rates = useRatesWithOracle();

  const { data: savingsRewards } = useUnclaimedRewards();
  const { data: feesRewards } = useUnclaimedFees();

  const rewards = useMemo(() => {
    return xChains.reduce((acc, xChain) => {
      let total = new BigNumber(0);
      if (lpRewards?.[xChain.xChainId]) {
        total = total.plus(lpRewards[xChain.xChainId].totalValueInUSD || 0);
      }
      if (savingsRewards) {
        total = total.plus(calculateTotal(savingsRewards[xChain.xChainId] || [], rates) || 0);
      }

      if (xChain.xChainId === '0x1.icon' && feesRewards) {
        total = total.plus(calculateTotal(feesRewards, rates) || 0);
      }

      acc[xChain.xChainId] = total;
      return acc;
    }, {});
  }, [lpRewards, savingsRewards, feesRewards, rates]);

  const sortedChains = useMemo(() => {
    return [...xChains].sort((a: XChain, b: XChain) => {
      const aRewardAmount = parseFloat(rewards[a.xChainId].toFixed());
      const bRewardAmount = parseFloat(rewards[b.xChainId].toFixed());

      const aXChainName = xChainMap[a.xChainId].name;
      const bXChainName = xChainMap[b.xChainId].name;
      const aXChainNameAscii = aXChainName.charCodeAt(0);
      const bXChainNameAscii = bXChainName.charCodeAt(0);

      if (aRewardAmount > 0 || bRewardAmount > 0) {
        if (aRewardAmount === bRewardAmount) return 0;
        return bRewardAmount > aRewardAmount ? 1 : -1;
      } else {
        if (aXChainNameAscii === bXChainNameAscii) return 0;
        return bXChainNameAscii > aXChainNameAscii ? -1 : 1;
      }
    });
  }, [rewards]);

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    if (isOpen) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const closeDropdown = () => {
    if (isOpen) {
      setOpen(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (containerRef) {
      setAnchor(containerRef);
    }
  }, [containerRef]);

  const setChainWrap = React.useCallback(
    (chainId: XChainId) => {
      onSavingsXChainSelection(chainId);
      setOpen(false);
    },
    [onSavingsXChainSelection],
  );

  return (
    <Flex>
      <ClickAwayListener onClickAway={closeDropdown}>
        <div>
          <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }}>
            <Typography fontSize={14} pr="1px" variant="span">
              <ChainSelectorLogo chain={xChainMap[savingsXChainId]} size={18} />
              {xChainMap[savingsXChainId].name}
            </Typography>
            <div ref={arrowRef} style={{ display: 'inline-block' }}>
              <StyledArrowDownIcon style={{ transform: 'translate3d(-2px, 2px, 0)' }} />
            </div>
          </SelectorWrap>

          <DropdownPopper
            show={isOpen}
            anchorEl={anchor}
            arrowEl={arrowRef.current}
            placement="bottom"
            offset={[0, 9]}
            containerOffset={containerRef ? containerRef.getBoundingClientRect().x + 2 : 0}
            strategy="absolute"
          >
            <ChainList
              setChainId={setChainWrap}
              chainId={savingsXChainId}
              chains={sortedChains}
              width={width}
              rewards={rewards}
            />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Flex>
  );
};
export default SavingsChainSelector;
