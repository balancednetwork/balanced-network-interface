import React, { useCallback, useEffect, useState, useMemo } from 'react';

import ExternalIcon from '@/assets/icons/external.svg';
import { Trans, t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { UnderlineTextWithArrow } from '@/app/components/DropdownText';
import { Link } from '@/app/components/Link';
import { LanguageMenuItem, MenuList } from '@/app/components/Menu';
import Modal, { ModalProps } from '@/app/components/Modal';
import { Typography } from '@/app/theme';
import ArchWalletIcon from '@/assets/icons/chains/archway.svg';
import ETHIcon from '@/assets/icons/chains/eth.svg';
import HavahWalletIcon from '@/assets/icons/chains/havah.svg';
import InjectiveWalletIcon from '@/assets/icons/chains/injective.svg';
import SuiWalletIcon from '@/assets/icons/chains/sui.svg';
import IconWalletIcon from '@/assets/icons/wallets/iconex.svg';

import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from '@/constants/locales';
import { useActiveLocale } from '@/hooks/useActiveLocale';
import { useModalOpen, useWalletModalToggle } from '@/store/application/hooks';
import { ApplicationModal } from '@/store/application/reducer';

import useDebounce from '@/hooks/useDebounce';
import { MODAL_ID } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import { getXChainType } from '@/xwagmi/actions';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { useXDisconnectAll } from '@/xwagmi/hooks';
import { useSwitchChain } from 'wagmi';
import Divider from '../Divider';
import { DropdownPopper } from '../Popover';
import { EVMWalletModal } from './EVMWalletModal';
import { InjectiveWalletOptionsModal } from './InjectiveWalletOptionsModal';
import { SuiWalletOptionsModal } from './SuiWalletOptionsModal';
import WalletItem, { WalletItemProps } from './WalletItem';
import { StyledSearchInput } from './styled';

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
  const signedInWallets = useSignedInWallets();

  const xDisconnectAll = useXDisconnectAll();

  const { switchChain } = useSwitchChain();
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

  const numberOfConnectedWallets = signedInWallets.filter(wallet => !!wallet.address && !!wallet.xChainId).length;
  const isLoggedInSome = numberOfConnectedWallets > 0;
  const [chainQuery, setChainQuery] = useState('');
  const debouncedQuery = useDebounce(chainQuery, 200);

  const handleChainQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChainQuery(e.target.value);
  };

  const walletConfig = useMemo(() => {
    const iconConfig = {
      name: 'ICON',
      xChainType: 'ICON',
      logo: <IconWalletIcon width="32" />,
      description: t`Borrow, swap, & transfer cross-chain. Supply liquidity. Vote.`,
      keyWords: ['iconex', 'hana'],
      xChains: undefined,
      switchChain: undefined,
    };

    return [
      iconConfig,
      ...[
        {
          name: 'Ethereum & EVM ecosystem',
          xChainType: 'EVM',
          logo: <ETHIcon width="32" />,
          description: t`Borrow, swap, & transfer cross-chain.`,
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
          xChains: Object.values(xChainMap)
            .filter(xChain => getXChainType(xChain.xChainId) === 'EVM' && !xChain.testnet)
            .sort((a, b) => a.name.localeCompare(b.name)),
          switchChain: switchChain,
          walletOptionsModalId: MODAL_ID.EVM_WALLET_OPTIONS_MODAL,
        },
        {
          name: 'Havah',
          xChainType: 'HAVAH',
          logo: <HavahWalletIcon width="40" height="40" />,
          description: t`Swap & transfer cross-chain.`,
          keyWords: ['iconex', 'hana'],
        },
        {
          name: 'Archway',
          xChainType: 'ARCHWAY',
          logo: <ArchWalletIcon width="32" />,
          description: t`Swap & transfer cross-chain.`,
          keyWords: ['archway', 'cosmos', 'keplr', 'leap'],
        },
        {
          name: 'Injective',
          xChainType: 'INJECTIVE',
          logo: <InjectiveWalletIcon width="40" height="40" />,
          description: t`Borrow, swap, & transfer cross-chain.`,
          keyWords: ['injective', 'cosmos', 'keplr', 'leap'],
          walletOptionsModalId: MODAL_ID.INJECTIVE_WALLET_OPTIONS_MODAL,
        },
        {
          name: 'Sui',
          xChainType: 'SUI',
          logo: <SuiWalletIcon width="40" height="40" />,
          description: t`Borrow, swap, & transfer cross-chain.`,
          keyWords: ['sui'],
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    ] as WalletItemProps[];
  }, [switchChain]);

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
        <div className="w-full flex flex-col gap-4 p-6">
          {isLoggedInSome ? (
            <div className="flex justify-between flex-col sm:flex-row mb-1 flex-nowrap">
              <Typography variant="h2">Manage wallets</Typography>
              <div className="flex flex-col items-start sm:items-end justify-center mt-1">
                <Typography>
                  {numberOfConnectedWallets > 1
                    ? t`Connected to ${numberOfConnectedWallets} blockchains`
                    : t`Connected to ${numberOfConnectedWallets} blockchain`}
                </Typography>
                <Typography onClick={xDisconnectAll} color="alert" style={{ cursor: 'pointer' }}>
                  Disconnect all
                </Typography>
              </div>
            </div>
          ) : (
            <div>
              <Typography textAlign="center" variant={'h2'} mb={1}>
                <Trans>Sign in to Balanced</Trans>
              </Typography>

              <div className="mt-3 mb-1 flex justify-center items-center">
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
              </div>
            </div>
          )}

          <StyledSearchInput
            type="text"
            value={chainQuery}
            onChange={handleChainQuery}
            placeholder="Search blockchains..."
            style={{ minHeight: '40px' }}
            tabIndex={isMobile ? -1 : 1}
          />

          <div className="py-1 px-6 min-h-14 max-h-[350px] overflow-y-scroll rounded-md bg-[#05193b]">
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
          </div>

          {!signedInWallets.length && (
            <Typography textAlign="center" as="div" maxWidth={300} mx="auto" mt={2}>
              <Trans>Use at your own risk. Project contributors are not liable for any lost or stolen funds.</Trans>
              <div className="pt-1">
                <Link href="https://balanced.network/disclaimer/" target="_blank" tabIndex={-1}>
                  <Trans>View disclaimer.</Trans>
                  <ExternalIcon width="11" height="11" style={{ marginLeft: '7px', marginTop: '-3px' }} />
                </Link>
              </div>
            </Typography>
          )}

          {isMobile && (
            <>
              <Divider />
              <div className="flex justify-center">
                <Typography onClick={toggleWalletModal}>
                  <Trans>Close</Trans>
                </Typography>
              </div>
            </>
          )}
        </div>
      </StyledModal>

      <EVMWalletModal />
      <InjectiveWalletOptionsModal />
      <SuiWalletOptionsModal />
    </>
  );
}
