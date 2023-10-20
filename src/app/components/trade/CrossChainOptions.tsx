import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { SupportedXCallChains } from 'app/_xcall/types';
import { getNetworkDisplayName } from 'app/_xcall/utils';
import { Typography } from 'app/theme';
import { useICONWalletModalToggle } from 'store/application/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { shortenAddress } from 'utils';

import ChainList from '../bridge/ChainList';
import { StyledArrowDownIcon, UnderlineText } from '../DropdownText';
import { DropdownPopper } from '../Popover';

type CrossChainInputOptionsProps = {
  currency?: Currency;
  chain: SupportedXCallChains;
  setChain: (chain: SupportedXCallChains) => void;
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

const CrossChainOptions = ({ currency, chain, setChain }: CrossChainInputOptionsProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const signedInWallets = useSignedInWallets();
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const ICONWalletModalToggle = useICONWalletModalToggle();

  const arrowRef = React.useRef(null);

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = e => {
    if (!e.target.classList.contains('search-field')) {
      setAnchor(null);
    }
  };

  React.useEffect(() => {
    return () => {
      setChain('icon');
    };
  }, [setChain, currency?.wrapped.address]);

  const getChainAddress = (chain): string | undefined => {
    const wallet = signedInWallets.find(wallet => wallet.chain === chain);
    if (wallet) {
      return wallet.address;
    }
  };

  const handleConnect = () => {
    if (chain === 'icon') ICONWalletModalToggle();
    if (chain === 'archway') connectKeplr();
  };

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
      </Flex>

      <Typography onClick={handleConnect} color="primaryBright">
        {getChainAddress(chain) ? (
          <UnderlineText>{shortenAddress(getChainAddress(chain) || '', 5)}</UnderlineText>
        ) : (
          <UnderlineText>Connect wallet</UnderlineText>
        )}
      </Typography>
    </Wrap>
  );
};

export default CrossChainOptions;
