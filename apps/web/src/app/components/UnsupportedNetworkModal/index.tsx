import React, { useEffect } from 'react';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import { useSignedInWallets } from 'app/pages/trade/bridge/_hooks/useWallets';
import { Typography } from 'app/theme';
import { Trans } from '@lingui/macro';
import { Flex } from 'rebass/styled-components';
import { Button } from 'app/components/Button';
import { useSwitchChain } from 'wagmi';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { XChainId } from 'app/pages/trade/bridge/types';
import noop from 'lodash-es/noop';

const defaultXChainId: XChainId = '0xa4b1.arbitrum';

const UnsupportedNetworkModal: React.FC = () => {
  const wallets = useSignedInWallets();

  const { switchChain } = useSwitchChain();
  const handleSwitchChain = () => {
    switchChain({ chainId: xChainMap[defaultXChainId].id as number });
  };

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    const isWrongNetwork = wallets.filter(w => !w.xChainId).length > 0;
    setOpen(isWrongNetwork);
  }, [wallets]);

  return (
    <>
      <Modal isOpen={open} onDismiss={noop}>
        <ModalContent noMessages={true}>
          <Typography variant="h3" textAlign="center" mb={20}>
            <Trans>You Are In Unsupported Network</Trans>
          </Typography>

          <Typography variant="h5" textAlign="center">
            <Trans>Switch network to continue</Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <Button onClick={handleSwitchChain} fontSize={14}>
              <Trans>Switch to {xChainMap[defaultXChainId].name}</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UnsupportedNetworkModal;
