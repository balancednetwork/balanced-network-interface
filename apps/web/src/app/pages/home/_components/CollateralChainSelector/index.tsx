import { StyledArrowDownIcon, UnderlineText } from 'app/components/DropdownText';
import { DropdownPopper } from 'app/components/Popover';
import ChainList from 'app/pages/trade/bridge/_components/ChainList';
import { ChainLogo } from 'app/pages/trade/bridge/_components/ChainLogo';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { xTokenMap } from 'app/pages/trade/bridge/_config/xTokens';
import { XChainId } from 'app/pages/trade/bridge/types';
import { getAvailableXChains } from 'app/pages/trade/bridge/utils';
import { Typography } from 'app/theme';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import React, { useEffect, useMemo } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import {
  useChangeCollateralXChain,
  useCollateralActionHandlers,
  useCollateralType,
  useCollateralXChain,
} from 'store/collateral/hooks';
import { useSetLoanRecipientNetwork } from 'store/loan/hooks';
import styled from 'styled-components';
import ChainSelectorLogo from './ChainSelectorLogo';

export const SelectorWrap = styled.div`
  min-width: 110px;
  cursor: pointer;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.primaryBright};
`;

const CollateralChainSelector = () => {
  const [isOpen, setOpen] = React.useState(false);
  const collateralType = useCollateralType();
  const collateralXChain = useCollateralXChain();
  const changeCollateralXChain = useChangeCollateralXChain();
  const setLoanRecipientNetwork = useSetLoanRecipientNetwork();
  const currency = SUPPORTED_TOKENS_LIST.find(token => token.symbol === collateralType);
  const { onAdjust: adjust } = useCollateralActionHandlers();

  const xChains = useMemo(() => getAvailableXChains(currency), [currency]);

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

  const isCrossChain: boolean = useMemo(() => {
    return (xChains?.length ?? 0) > 1;
  }, [xChains]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (arrowRef.current) {
      setAnchor(arrowRef.current);
    }
  }, [isCrossChain]);

  const setChainWrap = React.useCallback(
    (chainId: XChainId) => {
      adjust(false);
      changeCollateralXChain(chainId);
      setLoanRecipientNetwork(chainId);
      setOpen(false);
    },
    [changeCollateralXChain, setLoanRecipientNetwork, adjust],
  );

  return (
    <Flex>
      <Typography mr={1} lineHeight="1.7">
        Blockchain:
      </Typography>
      {isCrossChain ? (
        <ClickAwayListener onClickAway={closeDropdown}>
          <div>
            <SelectorWrap onClick={handleToggle} style={{ position: 'relative' }}>
              <UnderlineText style={{ paddingRight: '1px', fontSize: '14px' }}>
                <ChainSelectorLogo chain={xChainMap[collateralXChain]} />
                {xChainMap[collateralXChain].name}
              </UnderlineText>
              <div ref={arrowRef} style={{ display: 'inline-block' }}>
                <StyledArrowDownIcon style={{ transform: 'translate3d(-2px, -4px, 0)' }} />
              </div>
            </SelectorWrap>

            <DropdownPopper
              show={isOpen}
              anchorEl={anchor}
              arrowEl={arrowRef.current}
              placement="bottom"
              offset={[0, 10]}
            >
              <ChainList setChainId={setChainWrap} chainId={collateralXChain} chains={xChains} />
            </DropdownPopper>
          </div>
        </ClickAwayListener>
      ) : (
        <Flex>
          <Typography mr={1} lineHeight="1.7">
            <ChainSelectorLogo chain={xChainMap[collateralXChain]} />
            {xChainMap[collateralXChain].name}
          </Typography>
        </Flex>
      )}
    </Flex>
  );
};
export default CollateralChainSelector;
