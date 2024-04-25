import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Box } from 'rebass';
import styled from 'styled-components';

import { XChainId } from 'app/_xcall/types';
import { Typography } from 'app/theme';

import { StyledArrowDownIcon, UnderlineText } from '../../../../components/DropdownText';
import { DropdownPopper } from '../../../../components/Popover';
import ChainList from './ChainList';
import { xChainMap } from 'app/_xcall/archway/config1';

type ChainSelectorProps = {
  chainId: XChainId;
  setChainId: (chain: XChainId) => void;
  label: 'from' | 'to';
};

const Wrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const ChainSelector = ({ chainId, setChainId, label }: ChainSelectorProps) => {
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

  const chain = xChainMap[chainId];

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
            placement="bottom"
            offset={[0, 8]}
          >
            <ChainList setChainId={setChainId} chainId={chainId} />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Box>
  );
};

export default ChainSelector;
