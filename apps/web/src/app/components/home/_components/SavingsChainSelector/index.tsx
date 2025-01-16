import { StyledArrowDownIcon } from '@/app/components/DropdownText';
import { DropdownPopper } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import { useSavingsActionHandlers, useSavingsXChainId } from '@/store/savings/hooks';
import { xChainMap, xChains } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import React, { useEffect } from 'react';
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
            <ChainList setChainId={setChainWrap} chainId={savingsXChainId} chains={xChains} width={width} />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Flex>
  );
};
export default SavingsChainSelector;
