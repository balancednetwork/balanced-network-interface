import React, { useEffect, useState } from 'react';

import { BalancedJs, getLedgerAddressPath, LEDGER_BASE_PATH } from '@balancednetwork/balanced-js';
import * as HwUtils from '@balancednetwork/hw-app-icx/lib/utils';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { t, Trans } from '@lingui/macro';
import Skeleton from 'app/components/Skeleton';
import { useIconReact, LOCAL_STORAGE_ADDRESS_EXPIRY } from 'packages/icon-react';
import { isMobile } from 'react-device-detect';
import { toast } from 'react-toastify';
import { useMedia } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import Modal from 'app/components/Modal';
import { NotificationError } from 'app/components/Notification/TransactionNotification';
import { Typography } from 'app/theme';
import IconWalletIcon from 'assets/icons/wallets/iconex.svg';
import LedgerIcon from 'assets/icons/wallets/ledger.svg';
import bnJs from 'bnJs';
import { useLocalStorageWithExpiry } from 'hooks/useLocalStorage';
import {
  useWalletModalToggle,
  useCurrentLedgerAddressPage,
  useChangeCurrentLedgerAddressPage,
  useWalletModal,
} from 'store/application/hooks';

import { VerticalDivider } from '../Divider';
import { ModalContentWrapper } from '../ModalContent';
import { WalletOption, UnbreakableText } from './shared';
import { XWalletType } from 'app/pages/trade/bridge/types';

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

export const IconWalletModal = () => {
  const upExtraSmall = useMedia('(min-width: 420px)');
  const upSuperExtraSmall = useMedia('(min-width: 364px)');
  const toggleWalletModal = useWalletModalToggle();
  const [walletModal, , onDismiss] = useWalletModal();
  const [showLedgerAddress, updateShowLedgerAddress] = useState(false);
  const [addressList, updateAddressList] = useState<any>([]);
  const [isLedgerLoading, setLedgerLoading] = useState(false);
  const [isLedgerErr, setIsLedgerErr] = useState(false);

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
      initializeTransport(ledgerAddressPoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerAddressPoint]);

  const initializeTransport = async (ledgerAddressPoint?: number) => {
    try {
      if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
        await bnJs.contractSettings.ledgerSettings.transport.close();
      }

      const transport = await TransportWebHID.create();
      transport.setDebugMode && transport.setDebugMode();

      const legerSettings: any = { transport };
      if (typeof ledgerAddressPoint === 'number') {
        legerSettings.path = getLedgerAddressPath(ledgerAddressPoint);
      }

      bnJs.inject({
        legerSettings,
      });
    } catch (e) {
      console.log('initializeTransport err: ', e);
      disconnect();
    }
  };

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
    [limit, currentLedgerAddressPage, changeCurrentLedgerAddressPage, updateLedgerAddress],
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
    updateShowLedgerAddress(false);
    toggleWalletModal();
    onDismiss();
  };

  function getPageNumbers(index: number) {
    return index - 1 <= 0 ? [1, 2, 3] : [index - 1, index, index + 1];
  }

  //

  const disconnectLedger = () => {
    if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
      bnJs.contractSettings.ledgerSettings.transport.close();
    }
  };

  const handleOpenWallet = React.useCallback(() => {
    if (isMobile) {
      requestAddress();
    } else {
      if (hasExtension) {
        requestAddress();
        onDismiss();
      } else {
        window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl?hl=en', '_blank');
      }
    }
  }, [onDismiss, hasExtension, requestAddress]);

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

      await initializeTransport();

      updateShowLedgerAddress(true);

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
      updateShowLedgerAddress(false);
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

  return (
    <>
      <Modal isOpen={walletModal === XWalletType.ICON} onDismiss={onDismiss} maxWidth={360}>
        <ModalContentWrapper>
          <Typography textAlign="center" margin={'0 0 25px'}>
            Connect with:
          </Typography>
          <Flex alignItems="stretch" justifyContent="space-around" flexWrap={upExtraSmall ? 'nowrap' : 'wrap'}>
            <WalletOption onClick={handleOpenWallet}>
              <IconWalletIcon width="50" height="50" />
              <UnbreakableText>ICON wallet</UnbreakableText>
            </WalletOption>

            {upSuperExtraSmall && <VerticalDivider text={t`or`} />}

            <WalletOption onClick={handleOpenLedger}>
              <LedgerIcon width="50" height="50" />
              <UnbreakableText>Ledger</UnbreakableText>
            </WalletOption>
          </Flex>
        </ModalContentWrapper>
      </Modal>

      <LedgerAddressList
        isOpen={showLedgerAddress}
        onDismiss={() => {
          if (isLedgerLoading) return;

          updateShowLedgerAddress(false);
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
                        <td>
                          {!address ? (
                            <Skeleton width="100%" height="17.5px" />
                          ) : (
                            <span>{displayAddress(address.address)}</span>
                          )}
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%' }}>
                            {!address ? <Skeleton width="50%" height="17.5px" /> : address.balance + 'ICX'}
                          </span>
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
};
