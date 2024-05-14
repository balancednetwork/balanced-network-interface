import React from 'react';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { XChainId, XWalletType } from 'app/pages/trade/bridge/types';
import { Typography } from 'app/theme';
import { useWalletModal } from 'store/application/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { shortenAddress } from 'utils';

import { UnderlineText } from '../DropdownText';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';

const CrossChainWalletConnect = ({ chainId }: { chainId: XChainId }) => {
  const signedInWallets = useSignedInWallets();
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const [, setWalletModal] = useWalletModal();

  const getChainAddress = (_chainId: XChainId): string | undefined => {
    const wallet = signedInWallets.find(wallet => wallet.chainId === _chainId);
    if (wallet) {
      return wallet.address;
    }
  };

  const handleConnect = () => {
    const chain = xChainMap[chainId];
    if (chain.xWalletType === XWalletType.COSMOS) {
      connectKeplr();
    } else {
      setWalletModal(chain.xWalletType);
    }
  };

  return (
    <Typography onClick={handleConnect} color="primaryBright">
      {getChainAddress(chainId) ? (
        <UnderlineText>{shortenAddress(getChainAddress(chainId) || '', 5)}</UnderlineText>
      ) : (
        <UnderlineText>Connect wallet</UnderlineText>
      )}
    </Typography>
  );
};

export default CrossChainWalletConnect;
