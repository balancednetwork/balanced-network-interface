import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Box } from 'rebass';
import styled from 'styled-components';

import { SupportedXCallChains } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';

import { StyledArrowDownIcon, UnderlineText } from '../DropdownText';
import { DropdownPopper } from '../Popover';
import ChainList from './ChainList';

type ChainSelectorProps = {
  chain: SupportedXCallChains;
  setChain: (chain: SupportedXCallChains) => void;
  label: 'from' | 'to';
};

const Wrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const ChainSelector = ({ chain, setChain, label }: ChainSelectorProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = e => {
    if (!e.target.classList.contains('search-field')) {
      setAnchor(null);
    }
  };

  return (
    <Box>
      <Typography variant="label" style={{ textTransform: 'capitalize' }}>
        {label}
      </Typography>
      <Wrap onClick={handleToggle} style={{ position: 'relative' }}>
        <UnderlineText style={{ paddingRight: '1px' }}>{getNetworkDisplayName(chain)}</UnderlineText>
        <div ref={arrowRef} style={{ display: 'inline-block' }}>
          <StyledArrowDownIcon style={{ transform: 'translate3d(-1px, 1px, 0)' }} />
        </div>
      </Wrap>
      <ClickAwayListener onClickAway={e => closeDropdown(e)}>
        <DropdownPopper
          show={Boolean(anchor)}
          anchorEl={anchor}
          arrowEl={arrowRef.current}
          placement="bottom"
          offset={[0, 8]}
        >
          <ChainList setChain={setChain} chain={chain} />
        </DropdownPopper>
      </ClickAwayListener>
    </Box>
  );
};

export default ChainSelector;
