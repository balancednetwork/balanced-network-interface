import React, { useCallback, useEffect, useState, useMemo } from 'react';

import { t, Trans } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { Flex, Box } from 'rebass/styled-components';
import ExternalIcon from 'assets/icons/external.svg';
import styled from 'styled-components';

import { useArchwayContext } from 'packages/archway/ArchwayProvider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { Link } from 'app/components/Link';
import { MenuList, LanguageMenuItem } from 'app/components/Menu';
import Modal, { ModalProps } from 'app/components/Modal';
import { Typography } from 'app/theme';
import ArchWalletIcon from 'assets/icons/chains/archway.svg';
import IconWalletIcon from 'assets/icons/wallets/iconex.svg';
import HavahWalletIcon from 'assets/icons/chains/havah.svg';
import InjectiveWalletIcon from 'assets/icons/chains/injective.svg';

import ETHIcon from 'assets/icons/chains/eth.svg';
import { LOCALE_LABEL, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useWalletModalToggle, useModalOpen, useWalletModal } from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';

import { DropdownPopper } from '../Popover';
import WalletItem from './WalletItem';
import { IconWalletModal } from './IconWalletModal';
import { EVMWalletModal } from './EVMWalletModal';
import { XWalletType } from 'app/pages/trade/bridge/types';
import { useHavahContext } from 'packages/havah/HavahProvider';
import useWallets, { useSignedInWallets } from 'app/pages/trade/bridge/_hooks/useWallets';
import { xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { useSwitchChain } from 'wagmi';
import { SignInOptionsWrap, StyledSearchInput, Wrapper } from './styled';
import useDebounce from 'hooks/useDebounce';
import Divider from '../Divider';
import { TextButton } from '../Button';
import { MODAL_ID, modalActions } from 'app/pages/trade/bridge/_zustand/useModalStore';
import { InjectiveWalletOptionsModal } from 'packages/injective/InjectiveWalletOptionsModal';

const StyledModal = styled(({ mobile, ...rest }: ModalProps & { mobile?: boolean }) => <Modal {...rest} />)`
  &[data-reach-dialog-content] {
    width: 100%;
    max-width: 530px;
  }
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

  const { switchChain } = useSwitchChain();

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
  const debouncedQuery = useDebounce(chainQuery, 200);

  const handleChainQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChainQuery(e.target.value);
  };

  const disconnectAll = () => {
    Object.values(wallets).forEach(wallet => wallet.account && wallet.disconnect());
  };

  const walletConfig = useMemo(() => {
    const iconConfig = {
      name: 'ICON',
      logo: <IconWalletIcon width="32" />,
      connect: () => setWalletModal(XWalletType.ICON),
      disconnect: wallets[XWalletType.ICON].disconnect,
      description: t`Borrow bnUSD. Vote. Supply liquidity. Swap & transfer crypto cross-chain.`,
      keyWords: ['iconex', 'hana'],
      address: wallets[XWalletType.ICON].account,
      xChains: undefined,
      switchChain: undefined,
    };
    return [
      iconConfig,
      ...[
        {
          name: 'Ethereum & EVM ecosystem',
          logo: <ETHIcon width="32" />,
          connect: () => setWalletModal(XWalletType.EVM),
          disconnect: wallets[XWalletType.EVM].disconnect,
          description: t`Swap & transfer crypto cross-chain.`,
          keyWords: [
            'evm',
            'ethereum',
            'metamask',
            'rabby',
            'avalanche',
            'avax',
            'bnb',
            'bsc',
            'arb',
            'arbitrum',
            'binance',
            'base',
          ],
          address: wallets[XWalletType.EVM].account,
          xChains: Object.values(xChainMap)
            .filter(xChain => xChain.xWalletType === XWalletType.EVM && !xChain.testnet)
            .sort((a, b) => a.name.localeCompare(b.name)),
          switchChain: switchChain,
        },
        {
          name: 'Havah',
          logo: <HavahWalletIcon width="40" height="40" />,
          connect: connectToHavah,
          disconnect: wallets[XWalletType.HAVAH].disconnect,
          description: t`Swap & transfer crypto cross-chain.`,
          keyWords: ['iconex', 'hana'],
          address: wallets[XWalletType.HAVAH].account,
        },
        {
          name: 'Archway',
          logo: <ArchWalletIcon width="32" />,
          connect: connectToKeplr,
          disconnect: wallets[XWalletType.COSMOS].disconnect,
          description: t`Swap & transfer crypto cross-chain.`,
          keyWords: ['archway', 'cosmos', 'keplr', 'leap'],
          address: wallets[XWalletType.COSMOS].account,
          xChains: undefined,
          switchChain: undefined,
        },
        {
          name: 'Injective',
          logo: <InjectiveWalletIcon width="40" height="40" />,
          connect: () => modalActions.openModal(MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL),
          disconnect: wallets[XWalletType.INJECTIVE].disconnect,
          description: t`Swap & transfer crypto cross-chain.`,
          keyWords: ['injective', 'cosmos', 'keplr', 'leap'],
          address: wallets[XWalletType.INJECTIVE].account,
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [setWalletModal, connectToKeplr, wallets, switchChain, connectToHavah]);

  const filteredWallets = React.useMemo(() => {
    return [...walletConfig].filter(wallet => {
      return (
        wallet.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        wallet.keyWords.some(kw => kw.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
        wallet.description.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    });
  }, [walletConfig, debouncedQuery]);

  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleWalletModal} mobile={isMobile}>
        <Wrapper>
          {isLoggedInSome ? (
            <Flex mb={1} justifyContent="space-between" flexDirection={['column', 'row']} flexWrap="nowrap">
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
            <Box>
              <Typography textAlign="center" variant={'h2'} mb={1}>
                <Trans>Sign in to Balanced</Trans>
              </Typography>

              <Flex justifyContent="center" alignItems="center" mt="12px" mb={1}>
                <Typography mr={1}>
                  <Trans>Use Balanced in</Trans>:
                </Typography>
                <ClickAwayListener onClickAway={closeMenu}>
                  <div>
                    <UnderlineTextWithArrow
                      onClick={toggleMenu}
                      text={LOCALE_LABEL[activeLocale]}
                      arrowRef={arrowRef}
                    />
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
            </Box>
          )}

          <StyledSearchInput
            type="text"
            value={chainQuery}
            onChange={handleChainQuery}
            placeholder="Search for blockchains..."
            style={{ minHeight: '40px' }}
            tabIndex={isMobile ? -1 : 1}
          />

          <SignInOptionsWrap>
            <AnimatePresence>
              {filteredWallets.map((wallet, index) => (
                <motion.div key={wallet.name} {...presenceVariants} style={{ overflow: 'hidden' }}>
                  <WalletItem {...wallet} border={index + 1 < filteredWallets.length} />
                </motion.div>
              ))}
              {filteredWallets.length === 0 && (
                <motion.div key="no-result" {...presenceVariants}>
                  <Typography textAlign="center" paddingTop="20px">
                    No matches for <strong>{chainQuery}</strong>
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </SignInOptionsWrap>

          {!signedInWallets.length && (
            <Typography textAlign="center" as="div" maxWidth={300} mx="auto" mt={2}>
              <Trans>Use at your own risk. Project contributors are not liable for any lost or stolen funds.</Trans>
              <Box pt={'5px'}>
                <Link href="https://balanced.network/disclaimer/" target="_blank">
                  <Trans>View disclaimer.</Trans>
                  <ExternalIcon width="11" height="11" style={{ marginLeft: '7px', marginTop: '-3px' }} />
                </Link>
              </Box>
            </Typography>
          )}

          {isMobile && (
            <>
              <Divider />
              <Flex justifyContent="center">
                <Typography onClick={toggleWalletModal}>
                  <Trans>Close</Trans>
                </Typography>
              </Flex>
            </>
          )}
        </Wrapper>
      </StyledModal>

      <IconWalletModal />
      <EVMWalletModal />
      <InjectiveWalletOptionsModal />
    </>
  );
}
