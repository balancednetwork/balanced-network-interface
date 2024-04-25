import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { XChainId } from 'app/_xcall/types';
import { Typography } from 'app/theme';

import ChainList from '../../pages/trade/bridge/_components/ChainList';
import CrossChainWalletConnect from '../CrossChainWalletConnect';
import { StyledArrowDownIcon, UnderlineText } from '../DropdownText';
import { DropdownPopper } from '../Popover';
import { xChainMap } from 'app/_xcall/archway/config1';

type CrossChainOptionsProps = {
  currency?: Currency;
  chain: XChainId;
  setChain: (chain: XChainId) => void;
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
    (chain: XChainId) => {
      setChain(chain);
      setOpen(false);
    },
    [setChain, setOpen],
  );

  React.useEffect(() => {
    if (arrowRef.current) {
      setAnchor(arrowRef.current);
    }
  }, []);

  return (
    <Wrap>
      <Flex>
        <Typography mr={1} lineHeight="1.7">
          On
        </Typography>
        <ClickAwayListener onClickAway={e => closeDropdown(e)}>
          <div>
            <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }}>
              <UnderlineText style={{ paddingRight: '1px', fontSize: '14px' }}>{xChainMap[chain].name}</UnderlineText>
              <div ref={arrowRef} style={{ display: 'inline-block' }}>
                <StyledArrowDownIcon style={{ transform: 'translate3d(-1px, 1px, 0)' }} />
              </div>
            </SelectorWrap>

            <DropdownPopper
              show={isOpen}
              anchorEl={anchor}
              arrowEl={arrowRef.current}
              placement="bottom"
              offset={[0, 8]}
            >
              <ChainList setChainId={setChainWrap} chainId={chain} />
            </DropdownPopper>
          </div>
        </ClickAwayListener>
      </Flex>

      <CrossChainWalletConnect chainId={chain} />
    </Wrap>
  );
};

export default CrossChainOptions;
