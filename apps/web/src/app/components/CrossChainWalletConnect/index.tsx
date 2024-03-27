import React from 'react';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { SupportedXCallChains } from 'app/_xcall/types';
import { Typography } from 'app/theme';
import { useICONWalletModalToggle } from 'store/application/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { shortenAddress } from 'utils';

import { UnderlineText } from '../DropdownText';

const CrossChainWalletConnect = ({ chain }: { chain: SupportedXCallChains }) => {
  const signedInWallets = useSignedInWallets();
  const { connectToWallet: connectKeplr } = useArchwayContext();
  const ICONWalletModalToggle = useICONWalletModalToggle();

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
    <Typography onClick={handleConnect} color="primaryBright">
      {getChainAddress(chain) ? (
        <UnderlineText>{shortenAddress(getChainAddress(chain) || '', 5)}</UnderlineText>
      ) : (
        <UnderlineText>Connect wallet</UnderlineText>
      )}
    </Typography>
  );
};

export default CrossChainWalletConnect;
