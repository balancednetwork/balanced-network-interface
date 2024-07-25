import React, { useEffect, useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import styled, { useTheme } from 'styled-components';

import { XChain, XChainId } from 'app/pages/trade/bridge/types';
import { Typography } from 'app/theme';

import ChainList from '../../pages/trade/bridge/_components/ChainList';
import CrossChainWalletConnect from '../CrossChainWalletConnect';
import { StyledArrowDownIcon, UnderlineText } from '../DropdownText';
import { DropdownPopper } from '../Popover';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';

type CrossChainOptionsProps = {
  xChains?: XChain[];
  xChainId: XChainId;
  setXChainId: (chain: XChainId) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  editable?: boolean;
};

export const Wrap = styled(Flex)`
  align-items: center;
  padding: 3px 17px 4px;
  background: #0f395a;
  border-radius: 0 0 10px 10px;
  justify-content: space-between;
`;

export const SelectorWrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const CrossChainOptions = ({ xChainId, setXChainId, isOpen, setOpen, xChains, editable }: CrossChainOptionsProps) => {
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

  const setChainWrap = React.useCallback(
    (chainId_: XChainId) => {
      setXChainId(chainId_);
      setOpen(false);
    },
    [setXChainId, setOpen],
  );

  const isCrossChain: boolean = useMemo(() => {
    return (xChains?.length ?? 0) > 1;
  }, [xChains]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (arrowRef.current) {
      setAnchor(arrowRef.current);
    }
  }, [isCrossChain]);

  return (
    <Wrap>
      {isCrossChain ? (
        <Flex>
          <Typography mr={1} lineHeight="1.7">
            On
          </Typography>
          <ClickAwayListener onClickAway={closeDropdown}>
            <div>
              <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }}>
                <UnderlineText style={{ paddingRight: '1px', fontSize: '14px' }}>
                  {xChainMap[xChainId].name}
                </UnderlineText>
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
                <ChainList setChainId={setChainWrap} chainId={xChainId} chains={xChains} />
              </DropdownPopper>
            </div>
          </ClickAwayListener>
        </Flex>
      ) : (
        <Flex>
          <Typography mr={1} lineHeight="1.7">
            On {xChainMap[xChainId].name}
          </Typography>
        </Flex>
      )}

      <CrossChainWalletConnect xChainId={xChainId} editable={editable} />
    </Wrap>
  );
};

export default CrossChainOptions;
