import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Box } from 'rebass';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import useWidth from '@/hooks/useWidth';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId } from '@/xwagmi/types';
import { Currency } from '@balancednetwork/sdk-core';
import { StyledArrowDownIcon, UnderlineText } from '../../../../components/DropdownText';
import { DropdownPopper } from '../../../../components/Popover';
import XChainList from './XChainList';

type ChainSelectorProps = {
  chainId: XChainId;
  setChainId: (chain: XChainId) => void;
  currency?: Currency;
  label: 'from' | 'to';
  width?: number;
  containerRef?: HTMLDivElement | null;
};

const Wrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const XChainSelector = ({ chainId, setChainId, label, currency, width, containerRef }: ChainSelectorProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [arrowRef] = useWidth();

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : containerRef ?? null);
  };

  const closeDropdown = e => {
    if (!e.target.classList.contains('search-field')) {
      setAnchor(null);
    }
  };

  const chain = xChainMap[chainId];

  const handleSelect = _chainId => {
    setChainId(_chainId);
    setAnchor(null);
  };

  return (
    <Box>
      <Typography variant="label" style={{ textTransform: 'capitalize' }}>
        {label}
      </Typography>
      <ClickAwayListener onClickAway={e => closeDropdown(e)}>
        <div>
          <Wrap onClick={handleToggle} style={{ position: 'relative' }}>
            <UnderlineText style={{ paddingRight: '1px' }}>{chain.name}</UnderlineText>
            <div ref={arrowRef} style={{ display: 'inline-block' }}>
              <StyledArrowDownIcon style={{ transform: 'translate3d(-1px, 1px, 0)' }} />
            </div>
          </Wrap>

          <DropdownPopper
            show={Boolean(anchor)}
            anchorEl={anchor}
            arrowEl={arrowRef.current}
            customArrowStyle={{
              transform: `translateX(${arrowRef.current && containerRef ? Math.floor(arrowRef.current?.getBoundingClientRect().x - containerRef.getBoundingClientRect().x) + 25 + 'px' : '0'})`,
            }}
            placement="bottom"
            offset={[0, 8]}
            containerOffset={containerRef ? containerRef.getBoundingClientRect().x + 2 : 0}
          >
            <XChainList
              setChainId={handleSelect}
              xChainId={chainId}
              currency={currency}
              width={width ? width + 40 : undefined}
              isOpen={Boolean(anchor)}
            />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Box>
  );
};

export default XChainSelector;
