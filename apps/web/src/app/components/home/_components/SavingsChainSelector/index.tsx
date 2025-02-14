import { StyledArrowDownIcon } from '@/app/components/DropdownText';
import { DropdownPopper } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import { useLPRewards } from '@/queries/reward';
import { useSavingsActionHandlers, useSavingsXChainId } from '@/store/savings/hooks';
import { XChain, xChainMap, xChains } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
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

  const sortedChains = useMemo(() => {
    if (!lpRewards) return xChains;

    return [...xChains].sort((a: XChain, b: XChain) => {
      const aRewardAmount = parseFloat(lpRewards[a.xChainId]?.totalValueInUSD.toFixed() || '0');
      const bRewardAmount = parseFloat(lpRewards[b.xChainId]?.totalValueInUSD.toFixed() || '0');

      const aXChainName = xChainMap[a.xChainId].name;
      const bXChainName = xChainMap[b.xChainId].name;
      const aXChainNameAscii = aXChainName.charCodeAt(0);
      const bXChainNameAscii = bXChainName.charCodeAt(0);

      if (aRewardAmount > 0.01 || bRewardAmount > 0.01) {
        if (aRewardAmount === bRewardAmount) return 0;
        return bRewardAmount > aRewardAmount ? 1 : -1;
      } else {
        if (aXChainNameAscii === bXChainNameAscii) return 0;
        return bXChainNameAscii > aXChainNameAscii ? -1 : 1;
      }
    });
  }, [lpRewards]);

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
              lpRewards={lpRewards || {}}
            />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Flex>
  );
};
export default SavingsChainSelector;
