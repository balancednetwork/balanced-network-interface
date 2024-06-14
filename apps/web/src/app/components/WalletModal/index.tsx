import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { Link } from 'app/components/Link';
import { MenuList, LanguageMenuItem } from 'app/components/Menu';
import Modal, { ModalProps } from 'app/components/Modal';
import { Typography } from 'app/theme';
import ArchWalletIcon from 'assets/icons/chains/archway.svg';
import IconWalletIcon from 'assets/icons/wallets/iconex.svg';
import AvalancheWalletIcon from 'assets/icons/chains/avalanche.svg';
import HavahWalletIcon from 'assets/icons/chains/havah.svg';
import { LOCALE_LABEL, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useWalletModalToggle, useModalOpen, useWalletModal } from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';
import { useSignedInWallets } from 'store/wallet/hooks';

import { DropdownPopper } from '../Popover';
import SearchInput from '../SearchModal/SearchInput';
import WalletItem from './WalletItem';
import { IconWalletModal } from './IconWalletModal';
import { AvalancheWalletModal } from './AvalancheWalletModal';
import { XWalletType } from 'app/pages/trade/bridge/types';
import useWallets from 'app/pages/trade/bridge/_hooks/useWallets';
import { useHavahContext } from 'app/_xcall/havah/HavahProvider';

const StyledModal = styled(({ mobile, ...rest }: ModalProps & { mobile?: boolean }) => <Modal {...rest} />)`
  &[data-reach-dialog-content] {
    width: 320px;

    @media (min-width: 600px) {
      width: 100%;
      max-width: 495px;
    }
  }
`;

const Wrapper = styled.div`
  width: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ScrollHelper = styled.div`
  min-height: 120px;
  overflow-y: auto;
`;

const presenceVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

export default function WalletModal() {
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET);
  const toggleWalletModal = useWalletModalToggle();
  const [, setWalletModal] = useWalletModal();
  const signedInWallets = useSignedInWallets();
  const { connectToWallet: connectToKeplr } = useArchwayContext();
  const { connectToWallet: connectToHavah } = useHavahContext();

  const wallets = useWallets();

  const handleOpenWalletArchway = React.useCallback(() => {
    connectToKeplr();
  }, [connectToKeplr]);

  const handleOpenWalletHavah = React.useCallback(() => {
    connectToHavah();
  }, [connectToHavah]);

  //
  const activeLocale = useActiveLocale();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const toggleMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeMenu = useCallback(() => {
    setAnchor(null);
  }, []);

  useEffect(() => {
    if (walletModalOpen) {
      closeMenu();
    }
  }, [walletModalOpen, closeMenu]);

  const numberOfConnectedWallets = Object.values(wallets).filter(w => !!w.account).length;
  const isLoggedInSome = numberOfConnectedWallets > 0;
  const [chainQuery, setChainQuery] = useState('');

  const handleChainQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChainQuery(e.target.value);
  };

  const disconnectAll = () => {
    Object.values(wallets).forEach(wallet => wallet.account && wallet.disconnect());
  };

  const walletConfig = useMemo(() => {
    return [
      {
        name: 'ICON',
        logo: <IconWalletIcon width="40" height="40" />,
        connect: () => setWalletModal(XWalletType.ICON),
        disconnect: wallets[XWalletType.ICON].disconnect,
        description: t`Borrow bnUSD. Vote. Supply liquidity. Swap & transfer assets cross-chain`,
        address: wallets[XWalletType.ICON].account,
      },
      {
        name: 'Archway',
        logo: <ArchWalletIcon width="40" height="40" />,
        connect: handleOpenWalletArchway,
        disconnect: wallets[XWalletType.COSMOS].disconnect,
        description: t`Swap & transfer assets cross-chain.`,
        address: wallets[XWalletType.COSMOS].account,
      },
      {
        name: 'Avalanche',
        logo: <AvalancheWalletIcon width="40" height="40" />,
        connect: () => setWalletModal(XWalletType.EVM),
        disconnect: wallets[XWalletType.EVM].disconnect,
        description: t`Swap & transfer assets cross-chain.`,
        address: wallets[XWalletType.EVM].account,
      },
      {
        name: 'Havah',
        logo: <HavahWalletIcon width="40" height="40" />,
        connect: handleOpenWalletHavah,
        disconnect: wallets[XWalletType.HAVAH].disconnect,
        description: t`Swap & transfer assets cross-chain.`,
        address: wallets[XWalletType.HAVAH].account,
      },
    ];
  }, [setWalletModal, handleOpenWalletArchway, handleOpenWalletHavah, wallets]);

  const filteredWallets = React.useMemo(() => {
    return [...walletConfig].filter(wallet => {
      return (
        wallet.name.toLowerCase().includes(chainQuery.toLowerCase()) ||
        wallet.description.toLowerCase().includes(chainQuery.toLowerCase())
      );
    });
  }, [walletConfig, chainQuery]);

  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleWalletModal} mobile={isMobile}>
        <Wrapper>
          {isLoggedInSome ? (
            <Flex mb={1} justifyContent="space-between" flexWrap={['wrap', 'nowrap']}>
              <Typography variant="h2">Manage wallets</Typography>
              <Flex flexDirection="column" alignItems={['flex-start', 'flex-end']} justifyContent="center" mt={1}>
                <Typography>
                  {numberOfConnectedWallets > 1
                    ? t`Connected to ${numberOfConnectedWallets} blockchains`
                    : t`Connected to ${numberOfConnectedWallets} blockchain`}
                </Typography>
                <Typography onClick={disconnectAll} color="alert" style={{ cursor: 'pointer' }}>
                  Disconnect all
                </Typography>
              </Flex>
            </Flex>
          ) : (
            <Typography textAlign="center" variant={'h2'} mb={1}>
              <Trans>Sign in to Balanced</Trans>
            </Typography>
          )}

          <SearchInput
            type="text"
            value={chainQuery}
            onChange={handleChainQuery}
            placeholder="Search for blockchains..."
            style={{ minHeight: '40px' }}
          />

          <ScrollHelper>
            <AnimatePresence>
              {filteredWallets.map((wallet, index) => (
                <motion.div key={wallet.name} {...presenceVariants} style={{ overflow: 'hidden' }}>
                  <WalletItem {...wallet} border={index + 1 < filteredWallets.length} />
                </motion.div>
              ))}
              {filteredWallets.length === 0 && (
                <motion.div key="no-result" {...presenceVariants}>
                  <Typography textAlign="center">
                    No matches for <strong>{chainQuery}</strong>
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollHelper>

          <Flex justifyContent="center" alignItems="center" sx={{ borderRadius: 10 }} padding={2} bg="bg3">
            <Typography mr={1}>
              <Trans>Use Balanced in</Trans>:
            </Typography>
            <ClickAwayListener onClickAway={closeMenu}>
              <div>
                <UnderlineTextWithArrow onClick={toggleMenu} text={LOCALE_LABEL[activeLocale]} arrowRef={arrowRef} />
                <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end" zIndex={6001}>
                  <MenuList>
                    {SUPPORTED_LOCALES.map((locale: SupportedLocale) => (
                      <LanguageMenuItem
                        locale={locale}
                        active={activeLocale === locale}
                        onClick={closeMenu}
                        key={locale}
                      />
                    ))}
                  </MenuList>
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </Flex>

          {!signedInWallets.length && (
            <Typography textAlign="center" as="div" maxWidth={300} mx="auto" mt={2}>
              <Trans>Use at your own risk. Project contributors are not liable for any lost or stolen funds.</Trans>
              <Box>
                <Link href="https://balanced.network/disclaimer/" target="_blank">
                  <Trans>View disclaimer</Trans>
                </Link>
              </Box>
            </Typography>
          )}
        </Wrapper>
      </StyledModal>

      <IconWalletModal />

      <AvalancheWalletModal />
    </>
  );
}
