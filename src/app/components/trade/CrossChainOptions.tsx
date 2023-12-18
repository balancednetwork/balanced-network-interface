import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { SupportedXCallChains } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';

import ChainList from '../bridge/ChainList';
import CrossChainWalletConnect from '../CrossChainWalletConnect';
import { StyledArrowDownIcon, UnderlineText } from '../DropdownText';
import { DropdownPopper } from '../Popover';

type CrossChainOptionsProps = {
  currency?: Currency;
  chain: SupportedXCallChains;
  setChain: (chain: SupportedXCallChains) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export const Wrap = styled(Flex)`
  align-items: center;
  padding: 3px 17px 4px;
  background: #0f395a;
  transform: translateY(-15px);
  border-radius: 0 0 10px 10px;
  justify-content: space-between;
`;

export const SelectorWrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const CrossChainOptions = ({ currency, chain, setChain, isOpen, setOpen }: CrossChainOptionsProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    if (isOpen) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const closeDropdown = e => {
    if (isOpen) {
      setOpen(false);
    }
  };

  const setChainWrap = React.useCallback(
    (chain: SupportedXCallChains) => {
      setChain(chain);
      setOpen(false);
    },
    [setChain, setOpen],
  );

  React.useEffect(() => {
    if (arrowRef.current) {
      setAnchor(arrowRef.current);
    }
  }, [setAnchor]);

  return (
    <Wrap>
      <Flex>
        <Typography mr={1} lineHeight="1.7">
          On
        </Typography>
        <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }}>
          <UnderlineText style={{ paddingRight: '1px', fontSize: '14px' }}>
            {getNetworkDisplayName(chain)}
          </UnderlineText>
          <div ref={arrowRef} style={{ display: 'inline-block' }}>
            <StyledArrowDownIcon style={{ transform: 'translate3d(-1px, 1px, 0)' }} />
          </div>
        </SelectorWrap>
        <ClickAwayListener onClickAway={e => closeDropdown(e)}>
          <DropdownPopper show={isOpen} anchorEl={anchor} arrowEl={arrowRef.current} placement="bottom" offset={[0, 8]}>
            <ChainList setChain={setChainWrap} chain={chain} />
          </DropdownPopper>
        </ClickAwayListener>
      </Flex>

      <CrossChainWalletConnect chain={chain} />
    </Wrap>
  );
};

export default CrossChainOptions;
