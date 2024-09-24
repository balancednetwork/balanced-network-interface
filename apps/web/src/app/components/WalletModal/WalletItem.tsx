import React from 'react';

import { Box, Flex } from 'rebass';

import { Typography } from '@/app/theme';

import { ChainLogo } from '@/app/components2/ChainLogo';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useXAccount, useXConnect, useXConnectors, useXDisconnect } from '@/xwagmi/hooks';
import { XChain, XChainType } from '@/xwagmi/types';
import { t } from '@lingui/macro';
import { UnderlineText } from '../DropdownText';
import { CopyableAddress } from '../Header';
import { ActionDivider, ChainInfo, ChainName, MainLogo, WalletActions, WalletItemGrid, XChainsWrap } from './styled';

export type WalletItemProps = {
  name: string;
  xChainType: XChainType;
  logo: JSX.Element;
  description: string;
  border: boolean;
  keyWords: string[];
  xChains?: XChain[];
  switchChain?: (any) => void;
  walletOptionsModalId?: MODAL_ID;
};

const WalletItem = ({
  name,
  xChainType,
  logo,
  description,
  border,
  xChains,
  switchChain,
  walletOptionsModalId,
}: WalletItemProps) => {
  const { address } = useXAccount(xChainType);

  const handleSwitchChain = (chain: XChain): void => {
    switchChain && switchChain({ chainId: chain.id });
  };

  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();
  const xDisconnect = useXDisconnect();

  const handleConnect = () => {
    if (!xConnectors || xConnectors.length === 0) return;

    if (xChainType === 'EVM') {
      modalActions.openModal(MODAL_ID.EVM_WALLET_OPTIONS_MODAL);
    } else if (xChainType === 'INJECTIVE') {
      modalActions.openModal(MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL);
    } else {
      xConnect(xConnectors[0]);
    }
  };
  const handleDisconnect = () => {
    xDisconnect(xChainType);
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
            <UnderlineText onClick={handleConnect}>
              <Typography color="primaryBright">Change wallet</Typography>
            </UnderlineText>
            <ActionDivider text={t`or`} />
            <Typography color="alert" onClick={handleDisconnect} style={{ cursor: 'pointer' }}>
              Disconnect
            </Typography>
          </Flex>
        ) : (
          <UnderlineText onClick={handleConnect}>
            <Typography color="primaryBright">Connect wallet</Typography>
          </UnderlineText>
        )}
      </WalletActions>
    </WalletItemGrid>
  );
};

export default WalletItem;
