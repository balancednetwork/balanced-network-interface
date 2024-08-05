import React from 'react';

import { Box, Flex } from 'rebass';

import { Typography } from '@/app/theme';

import { UnderlineText } from '../DropdownText';
import { XChain } from '@/app/pages/trade/bridge/types';
import { ChainLogo } from '@/app/components/ChainLogo';
import { CopyableAddress } from '../Header';
import { t } from '@lingui/macro';
import { ActionDivider, ChainInfo, ChainName, MainLogo, WalletActions, WalletItemGrid, XChainsWrap } from './styled';
import { useSignedInWallets } from '@/app/pages/trade/bridge/_hooks/useWallets';

type WalletItemProps = {
  address: string | null | undefined;
  name: string;
  logo: JSX.Element;
  connect: () => void;
  disconnect: () => void;
  description: string;
  border: boolean;
  xChains?: XChain[];
  switchChain?: (any) => void;
};

const WalletItem = ({
  address,
  name,
  logo,
  connect,
  disconnect,
  description,
  border,
  xChains,
  switchChain,
}: WalletItemProps) => {
  const signedInWallets = useSignedInWallets();

  const handleSwitchChain = (chain: XChain): void => {
    switchChain && switchChain({ chainId: chain.id });
  };

  return (
    <WalletItemGrid className={border ? 'border-bottom' : ''}>
      <MainLogo>{logo}</MainLogo>
      <ChainInfo>
        <ChainName fontWeight="bold" color="text" fontSize={15} mb="5px">
          {name}
        </ChainName>
        <Flex>
          <Typography color="text1">
            {address ? <CopyableAddress account={address} copyIcon placement="right" /> : description}
          </Typography>
        </Flex>
        {xChains && (
          <XChainsWrap signedIn={!!address}>
            {xChains.map(chain => (
              <Box key={chain.xChainId} onClick={() => handleSwitchChain(chain)} style={{ cursor: 'pointer' }}>
                <ChainLogo chain={chain} size="24px" key={chain.xChainId} />
              </Box>
            ))}
          </XChainsWrap>
        )}
      </ChainInfo>
      <WalletActions>
        {address ? (
          <Flex className="wallet-options">
            <UnderlineText onClick={connect}>
              <Typography color="primaryBright">Change wallet</Typography>
            </UnderlineText>
            <ActionDivider text={t`or`} />
            <Typography color="alert" onClick={disconnect} style={{ cursor: 'pointer' }}>
              Disconnect
            </Typography>
          </Flex>
        ) : (
          <UnderlineText onClick={connect}>
            <Typography color="primaryBright">Connect wallet</Typography>
          </UnderlineText>
        )}
      </WalletActions>
    </WalletItemGrid>
  );
};

export default WalletItem;
