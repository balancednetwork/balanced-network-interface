import React, { useState } from 'react';

import * as HwUtils from '@ledgerhq/hw-app-icx/lib/utils';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { BalancedJs } from 'packages/BalancedJs';
import { getLedgerAddressPath, LEDGER_BASE_PATH } from 'packages/BalancedJs/contractSettings';
import { useIconReact } from 'packages/icon-react';
import { isMobile } from 'react-device-detect';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { VerticalDivider } from 'app/components/Divider';
import { Link } from 'app/components/Link';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as IconWalletIcon } from 'assets/icons/iconex.svg';
import { ReactComponent as LedgerIcon } from 'assets/icons/ledger.svg';
import bnJs from 'bnJs';
import { ApplicationModal } from 'store/application/actions';
import { useWalletModalToggle, useModalOpen } from 'store/application/hooks';

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

const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px 20px;
  margin: 0px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;

  > *:first-child {
    margin-bottom: 10px;
  }

  :hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;

const StyledModal = styled(Modal).attrs({
  'aria-label': 'dialog',
})`
  &[data-reach-dialog-content] {
    width: 320px;
  }
`;

export default function WalletModal() {
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET);
  const toggleWalletModal = useWalletModalToggle();
  const [showLedgerAddress, updateShowledgerAddress] = useState(false);
  const [addressList, updateAddressList] = useState<any>([]);
  const [isLedgerLoading, setLedgerLoading] = useState(false);
  const [isLedgerErr, setIsLedgerErr] = useState(false);

  const [{ offset, limit }, updatePaging] = useState({
    offset: 0,
    limit: LIMIT_PAGING_LEDGER,
  });
  const [currentLedgerAddressPage, changeCurrentLedgerAddressPage] = useState(1);

  const { requestAddress, hasExtension } = useIconReact();

  const handleOpenWallet = () => {
    toggleWalletModal();
    if (isMobile) {
      requestAddress();
    } else {
      if (hasExtension) {
        requestAddress();
      } else {
        window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl?hl=en', '_blank');
      }
    }
  };

  const updateLedgerAddress = React.useCallback(async ({ offset, limit }) => {
    const addressList: any[] = await requestLedgerAddress({
      paging: {
        offset,
        limit,
      },
    });

    updateAddressList(addressList);
    resolveBalanceByAddress(addressList);
  }, []);

  const resolveBalanceByAddress = async (addressList: any[]) => {
    const data = await Promise.all(
      addressList.map((address: any) => {
        return new Promise((resolve, reject) => {
          bnJs.ICX.balanceOf(address.address)
            .then(balance => {
              resolve({
                ...address,
                balance: BalancedJs.utils.toIcx(balance).toFixed(2),
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
    updatePaging({
      offset: 0,
      limit: LIMIT_PAGING_LEDGER,
    });

    const timeout = setTimeout(() => {
      setIsLedgerErr(true);
    }, 3 * 1000);

    try {
      const transport = await TransportWebHID.create();
      transport.setDebugMode && transport.setDebugMode(false);
      bnJs.inject({
        legerSettings: {
          transport,
        },
      });
      updateShowledgerAddress(true);

      await updateLedgerAddress({ offset, limit });
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      if (err.id === 'InvalidChannel') {
        await bnJs.contractSettings.ledgerSettings.transport.close();
        return setTimeout(() => {
          handleOpenLedger();
        }, 0);
      }
      alert('Inject your ledger device, enter your password and retry');
    }
  };

  const getLedgerPage = React.useCallback(
    async (pageNum: number) => {
      updateAddressList([]);

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

      // disable current page
      if (pageNum === currentLedgerAddressPage) {
        return;
      }

      const next = (pageNum - 1) * limit;

      await updateLedgerAddress({ offset: next, limit });
      clearTimeout(timeout);

      // setLedgerLoading(false);
      setIsLedgerErr(false);

      updatePaging({
        limit,
        offset: next,
      });
      changeCurrentLedgerAddressPage(pageNum);
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
  };

  function getPageNumbers(index: number) {
    return index - 1 <= 0 ? [1, 2, 3] : [index - 1, index, index + 1];
  }

  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleWalletModal}>
        <Box mx="auto" my={5}>
          <Typography textAlign="center" mb={5}>
            Sign in with:
          </Typography>

          <Flex alignItems="stretch" justifyContent="space-between" mx={3}>
            <WalletOption onClick={handleOpenWallet}>
              <IconWalletIcon width="50" height="50" />
              <Text>ICON Wallet</Text>
            </WalletOption>

            <VerticalDivider text="or"></VerticalDivider>

            <WalletOption onClick={handleOpenLedger}>
              <LedgerIcon width="50" height="50" />
              <Text>Ledger</Text>
            </WalletOption>
          </Flex>

          <Typography mx={4} mt={6} textAlign="center">
            Use at your own risk. Project contributors are not liable for any lost or stolen funds.{' '}
            <Link href="https://balanced.network/disclaimer/" target="_blank">
              View disclaimer.
            </Link>
          </Typography>
        </Box>
      </StyledModal>

      <LedgerAddressList
        isOpen={showLedgerAddress}
        onDismiss={() => {
          if (isLedgerLoading) return;

          updateShowledgerAddress(false);
          bnJs.contractSettings.ledgerSettings.transport.close();
        }}
      >
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3}>
            Choose a wallet from your Ledger:
          </Typography>
          {isLedgerLoading && (
            <Flex justifyContent="center">
              <Spinner></Spinner>
            </Flex>
          )}
          {isLedgerErr && (
            <Flex justifyContent="center" mt={4} mb={4}>
              <Typography>
                Cancel any pending transactions on your Ledger, or give Chrome permission to use it.
              </Typography>
            </Flex>
          )}
          {!isLedgerErr && (
            <>
              <table className="wallet">
                <tbody>
                  {addressList.map((address: any) => {
                    return (
                      <tr
                        key={address.point}
                        onClick={() => {
                          chooseLedgerAddress({
                            address: address.address,
                            point: address.point,
                          });
                        }}
                      >
                        <td style={{ textAlign: 'left' }}>{displayAddress(address.address)}</td>
                        <td style={{ textAlign: 'right' }}>{address.balance} ICX</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!isLedgerLoading && (
                <ul className="pagination">
                  <li
                    onClick={async () => {
                      await getLedgerPage(currentLedgerAddressPage - 1);
                    }}
                  >
                    ˂
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
                    ˃
                  </li>
                </ul>
              )}
            </>
          )}
        </Flex>
      </LedgerAddressList>
    </>
  );
}
