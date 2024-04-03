import React, { useEffect, useState } from 'react';

import { BalancedJs, getLedgerAddressPath, LEDGER_BASE_PATH } from '@balancednetwork/balanced-js';
import * as HwUtils from '@balancednetwork/hw-app-icx/lib/utils';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { t, Trans } from '@lingui/macro';
import { Skeleton } from '@material-ui/lab';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact, LOCAL_STORAGE_ADDRESS_EXPIRY } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { toast } from 'react-toastify';
import { useMedia } from 'react-use';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import { Link } from 'app/components/Link';
import { MenuList, LanguageMenuItem } from 'app/components/Menu';
import Modal, { ModalProps } from 'app/components/Modal';
import { NotificationError } from 'app/components/Notification/TransactionNotification';
import { Typography } from 'app/theme';
import { ReactComponent as ArchWalletIcon } from 'assets/icons/archway.svg';
import { ReactComponent as IconWalletIcon } from 'assets/icons/iconex.svg';
import { ReactComponent as LedgerIcon } from 'assets/icons/ledger.svg';
import bnJs from 'bnJs';
import { LOCALE_LABEL, SupportedLocale, SUPPORTED_LOCALES } from 'constants/locales';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useLocalStorageWithExpiry } from 'hooks/useLocalStorage';
import {
  useWalletModalToggle,
  useModalOpen,
  useCurrentLedgerAddressPage,
  useChangeCurrentLedgerAddressPage,
  useICONWalletModalToggle,
  useIsICONWalletModalOpen,
} from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';
import { useSignedInWallets } from 'store/wallet/hooks';

import { VerticalDivider } from '../Divider';
import { ModalContentWrapper } from '../ModalContent';
import { DropdownPopper } from '../Popover';
import SearchInput from '../SearchModal/SearchInput';
import WalletItem from './WalletItem';

const displayAddress = (address: string) => `${address.slice(0, 9)}...${address.slice(-7)}`;

const generatePaths = (point: number) => {
  const paths = HwUtils.splitPath(`${LEDGER_BASE_PATH}/${point}'`);
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
};

const requestLedgerAddress = async ({
  paging: { offset, limit },
}: {
  paging: {
    offset: number;
    limit: number;
  };
}): Promise<any[]> => {
  const addressFromLedger: any[] = [];

  for (let i = offset; i < offset + limit; i++) {
    const buffer = generatePaths(i);
    const response = await bnJs.contractSettings.ledgerSettings.transport.send(0xe0, 0x02, 0x00, 0x01, buffer);

    const publicKeyLength = response[0];
    const addressLength = response[1 + publicKeyLength];

    addressFromLedger.push({
      publicKey: response.slice(1, 1 + publicKeyLength).toString('hex'),
      address: response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString(),
      chainCode: '',
      point: i,
      balance: '-',
    });
  }

  return addressFromLedger;
};

const LIMIT_PAGING_LEDGER = 5;

const LedgerAddressList = styled(Modal)`
  width: 500px;
`;

const ChainIcons = styled.div``;
const WalletIcons = styled.div``;

const StyledSkeleton = styled(Skeleton)`
  background-color: rgba(44, 169, 183, 0.2) !important;
  display: inline-block !important;
`;

const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  cursor: pointer;
  padding: 10px 20px;
  margin: 0px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;
  width: 130px;
  max-width: 100px;

  ${ChainIcons}, ${WalletIcons} {
    position: absolute;
    right: 5px;
    bottom: 38px;
    display: flex;
    flex-flow: column;
    opacity: 0.6;

    > * {
      margin-top: 7px;
    }

    img {
      width: 15px;
      height: 15px;
    }
  }

  ${({ theme }) => theme.mediaWidth.up420`
    max-width: 130px;
  `};

  > *:first-child {
    margin-bottom: 10px;
  }

  :hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;

const StyledModal = styled(({ mobile, ...rest }: ModalProps & { mobile?: boolean }) => <Modal {...rest} />).attrs({
  'aria-label': 'dialog',
})`
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

const UnbrakebleText = styled(Text)`
  white-space: nowrap;
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
  const ICONWalletModalToggle = useICONWalletModalToggle();
  const isICONWalletModalOpen = useIsICONWalletModalOpen();
  const [showLedgerAddress, updateShowledgerAddress] = useState(false);
  const [addressList, updateAddressList] = useState<any>([]);
  const [isLedgerLoading, setLedgerLoading] = useState(false);
  const [isLedgerErr, setIsLedgerErr] = useState(false);
  const signedInWallets = useSignedInWallets();
  const upExtraSmall = useMedia('(min-width: 420px)');
  const upSuperExtraSmall = useMedia('(min-width: 364px)');
  const { connectToWallet: connectToKeplr, address: accountArch, disconnect: disconnectKeplr } = useArchwayContext();

  const [{ offset, limit }, updatePaging] = useState({
    offset: 0,
    limit: LIMIT_PAGING_LEDGER,
  });
  const currentLedgerAddressPage = useCurrentLedgerAddressPage();
  const changeCurrentLedgerAddressPage = useChangeCurrentLedgerAddressPage();

  const { requestAddress, hasExtension, account, disconnect } = useIconReact();
  const renderedAddressList = isLedgerLoading ? new Array(LIMIT_PAGING_LEDGER).fill(undefined) : addressList;
  const [ledgerAddressPoint] = useLocalStorageWithExpiry<number>(
    'ledgerAddressPointWithExpiry',
    0,
    LOCAL_STORAGE_ADDRESS_EXPIRY,
  );

  // init transport
  useEffect(() => {
    if (
      localStorage.getItem('ledgerAddressPointWithExpiry') &&
      ledgerAddressPoint !== -1 &&
      !bnJs.contractSettings.ledgerSettings.transport
    ) {
      initialiseTransport(ledgerAddressPoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerAddressPoint]);

  const initialiseTransport = async (ledgerAddressPoint?: number) => {
    try {
      if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
        await bnJs.contractSettings.ledgerSettings.transport.close();
      }

      const transport = await TransportWebHID.create();
      transport.setDebugMode && transport.setDebugMode(false);

      const legerSettings: any = { transport };
      if (typeof ledgerAddressPoint === 'number') {
        legerSettings.path = getLedgerAddressPath(ledgerAddressPoint);
      }

      bnJs.inject({
        legerSettings,
      });
    } catch (e) {
      console.log('initialiseTransport err: ', e);
      disconnect();
    }
  };

  const handleOpenWallet = React.useCallback(() => {
    if (isMobile) {
      requestAddress();
    } else {
      if (hasExtension) {
        requestAddress();
        ICONWalletModalToggle();
      } else {
        window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl?hl=en', '_blank');
      }
    }
  }, [ICONWalletModalToggle, hasExtension, requestAddress]);

  const handleOpenWalletArchway = React.useCallback(() => {
    connectToKeplr();
  }, [connectToKeplr]);

  const updateLedgerAddress = React.useCallback(async ({ offset, limit }) => {
    const currentAddressList: any[] = await requestLedgerAddress({
      paging: {
        offset,
        limit,
      },
    });

    setIsLedgerErr(false);
    updateAddressList(currentAddressList);
    resolveBalanceByAddress(currentAddressList);
  }, []);

  const resolveBalanceByAddress = async (addressList: any[]) => {
    const data = await Promise.all(
      addressList.map((address: any) => {
        return new Promise((resolve, reject) => {
          bnJs.ICX.balanceOf(address.address)
            .then(balance => {
              resolve({
                ...address,
                balance: BalancedJs.utils.toIcx(balance.toFixed()).toFixed(2),
              });
            })
            .catch(reject);
        });
      }),
    );
    updateAddressList(data);
    setLedgerLoading(false);
  };

  const handleOpenLedger = async () => {
    setLedgerLoading(true);
    setIsLedgerErr(false);
    updateAddressList([]);

    if (!account) {
      updatePaging({
        offset: 0,
        limit: LIMIT_PAGING_LEDGER,
      });
      changeCurrentLedgerAddressPage(1);
    }

    const timeout = setTimeout(() => {
      setIsLedgerErr(true);
    }, 3 * 1000);

    try {
      disconnectLedger();

      await initialiseTransport();

      updateShowledgerAddress(true);

      await updateLedgerAddress(!account ? { offset: 0, limit: LIMIT_PAGING_LEDGER } : { offset, limit });
      clearTimeout(timeout);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.id === 'InvalidChannel') {
        await bnJs.contractSettings.ledgerSettings.transport.close();
        return setTimeout(() => {
          handleOpenLedger();
        }, 0);
      }
      updateShowledgerAddress(false);
      toast(
        <NotificationError
          title="Couldn't detect a Ledger device."
          failureReason={t`Make sure it's connected and try again.`}
        />,
        {
          toastId: 'genericError',
          autoClose: 5000,
        },
      );
    }
  };

  const getLedgerPage = React.useCallback(
    async (pageNum: number) => {
      // disable current page
      if (pageNum === currentLedgerAddressPage) {
        return;
      }
      // updateAddressList([]);

      setLedgerLoading(true);
      setIsLedgerErr(false);

      const timeout = setTimeout(() => {
        setIsLedgerErr(true);
      }, 3 * 1000);

      if (pageNum <= 0) {
        // should disable page number < 0;
        console.log('This is first pages, cannot request more address, try other please.');
        return;
      }

      const next = (pageNum - 1) * limit;
      updatePaging({
        limit,
        offset: next,
      });
      changeCurrentLedgerAddressPage(pageNum);

      await updateLedgerAddress({ offset: next, limit });
      clearTimeout(timeout);

      // setLedgerLoading(false);
      setIsLedgerErr(false);
    },
    [limit, currentLedgerAddressPage, updatePaging, changeCurrentLedgerAddressPage, updateLedgerAddress],
  );

  const chooseLedgerAddress = ({ address, point }: { address: string; point: number }) => {
    requestAddress({
      address,
      point,
    });
    bnJs.inject({
      account: address,
      legerSettings: {
        path: getLedgerAddressPath(point),
      },
    });
    updateShowledgerAddress(false);
    toggleWalletModal();
    ICONWalletModalToggle();
  };

  function getPageNumbers(index: number) {
    return index - 1 <= 0 ? [1, 2, 3] : [index - 1, index, index + 1];
  }

  //
  const activeLocale = useActiveLocale();
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const toggleMenu = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeMenu = () => {
    setAnchor(null);
  };

  useEffect(() => {
    if (walletModalOpen) {
      closeMenu();
    }
  }, [walletModalOpen]);

  const isLoggedInSome = account || accountArch;
  const numberOfConnectedWallets = Number(!!account) + Number(!!accountArch);
  const [chainQuery, setChainQuery] = useState('');

  const handleChainQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChainQuery(e.target.value);
  };

  const disconnectLedger = () => {
    if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
      bnJs.contractSettings.ledgerSettings.transport.close();
    }
  };

  const disconnectAll = () => {
    disconnectLedger();
    account && disconnect();
    accountArch && disconnectKeplr();
  };

  const walletConfig = React.useMemo(() => {
    return [
      {
        name: 'ICON',
        logo: <IconWalletIcon width="40" height="40" />,
        connect: ICONWalletModalToggle,
        disconnect: () => {
          disconnectLedger();
          disconnect();
        },
        description: t`Borrow bnUSD. Vote. Supply liquidity. Swap & transfer assets cross-chain`,
        address: account,
      },
      {
        name: 'Archway',
        logo: <ArchWalletIcon width="40" height="40" />,
        connect: handleOpenWalletArchway,
        disconnect: disconnectKeplr,
        description: t`Swap & transfer assets cross-chain.`,
        address: accountArch,
      },
    ];
  }, [ICONWalletModalToggle, disconnect, account, handleOpenWalletArchway, disconnectKeplr, accountArch]);

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

      <Modal isOpen={isICONWalletModalOpen} onDismiss={ICONWalletModalToggle} maxWidth={360}>
        <ModalContentWrapper>
          <Typography textAlign="center" margin={'0 0 25px'}>
            Connect with:
          </Typography>
          <Flex alignItems="stretch" justifyContent="space-around" flexWrap={upExtraSmall ? 'nowrap' : 'wrap'}>
            <WalletOption onClick={handleOpenWallet}>
              <IconWalletIcon width="50" height="50" />
              <UnbrakebleText>ICON wallet</UnbrakebleText>
            </WalletOption>

            {upSuperExtraSmall && <VerticalDivider text={t`or`} />}

            <WalletOption onClick={handleOpenLedger}>
              <LedgerIcon width="50" height="50" />
              <UnbrakebleText>Ledger</UnbrakebleText>
            </WalletOption>
          </Flex>
        </ModalContentWrapper>
      </Modal>

      <LedgerAddressList
        isOpen={showLedgerAddress}
        onDismiss={() => {
          if (isLedgerLoading) return;

          updateShowledgerAddress(false);
        }}
      >
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3}>
            <Trans>Choose a wallet from your Ledger:</Trans>
          </Typography>

          {isLedgerErr && (
            <Flex justifyContent="center" mt={4} mb={4}>
              <Typography>
                <Trans>Cancel any pending transactions on your Ledger, or give Chrome permission to use it.</Trans>
              </Typography>
            </Flex>
          )}
          {!isLedgerErr && (
            <>
              <table className="wallet">
                <tbody>
                  {renderedAddressList.map((address: any, index: number) => {
                    return (
                      <tr
                        className={account === address?.address ? 'active' : ''}
                        key={address?.point || index}
                        onClick={() => {
                          if (!address) return;
                          chooseLedgerAddress({
                            address: address.address,
                            point: address.point,
                          });
                        }}
                        style={{ pointerEvents: isLedgerLoading ? 'none' : 'auto' }}
                      >
                        <td style={{ textAlign: 'left' }}>
                          {!address ? <StyledSkeleton width="100%" /> : displayAddress(address.address)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!address ? <StyledSkeleton width="50%" /> : address.balance + 'ICX'}{' '}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <ul className="pagination" style={{ pointerEvents: isLedgerLoading ? 'none' : 'auto' }}>
                <li
                  onClick={async () => {
                    await getLedgerPage(currentLedgerAddressPage - 1);
                  }}
                >
                  {'<'}
                </li>
                {getPageNumbers(currentLedgerAddressPage).map(value => {
                  return (
                    <li
                      key={Date.now() + Math.random()}
                      className={value === currentLedgerAddressPage ? 'actived' : ''}
                      onClick={async () => {
                        await getLedgerPage(value);
                      }}
                    >
                      {value}
                    </li>
                  );
                })}
                <li
                  onClick={async () => {
                    await getLedgerPage(currentLedgerAddressPage + 1);
                  }}
                >
                  {'>'}
                </li>
              </ul>
            </>
          )}
        </Flex>
      </LedgerAddressList>
    </>
  );
}
