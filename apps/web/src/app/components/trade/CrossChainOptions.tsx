import React, { useEffect, useMemo } from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { Typography } from '@/app/theme';

import XChainList from '@/app/pages/trade/bridge/_components/XChainList';
import useWidth from '@/hooks/useWidth';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChain, XChainId } from '@/xwagmi/types';
import { Currency } from '@balancednetwork/sdk-core';
import CrossChainWalletConnect from '../CrossChainWalletConnect';
import { StyledArrowDownIcon, UnderlineText } from '../DropdownText';
import { DropdownPopper } from '../Popover';

type CrossChainOptionsProps = {
  xChains?: XChain[];
  xChainId: XChainId;
  setXChainId: (chain: XChainId) => void;
  currency?: Currency | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  editable?: boolean;
  width?: number;
  containerRef: HTMLDivElement | null;
  setManualAddress?: (xChainId: XChainId, address?: string | undefined) => void;
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
`;

const CrossChainOptions = ({
  xChainId,
  setXChainId,
  isOpen,
  setOpen,
  xChains,
  editable,
  currency,
  width,
  containerRef,
  setManualAddress,
}: CrossChainOptionsProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [arrowRef] = useWidth();

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
    if (containerRef) {
      setAnchor(containerRef);
    }
  }, [isCrossChain, isOpen]);

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
                customArrowStyle={{
                  transform: `translateX(${arrowRef.current && containerRef ? Math.floor(arrowRef.current?.getBoundingClientRect().x - containerRef.getBoundingClientRect().x) + 25 + 'px' : '0'})`,
                }}
                placement="bottom"
                forcePlacement={true}
                offset={[0, 35]}
                containerOffset={containerRef ? containerRef.getBoundingClientRect().x + 2 : 0}
                strategy="absolute"
              >
                <XChainList
                  setChainId={setChainWrap}
                  xChainId={xChainId}
                  chains={xChains}
                  currency={currency ?? undefined}
                  width={width}
                  isOpen={isOpen}
                />
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

      <CrossChainWalletConnect xChainId={xChainId} editable={editable} setManualAddress={setManualAddress} />
    </Wrap>
  );
};

export default CrossChainOptions;
