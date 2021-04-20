import React, { useState, useCallback } from 'react';

import * as HwUtils from '@ledgerhq/hw-app-icx/lib/utils';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { getLedgerAddressPath, LEDGER_BASE_PATH } from 'packages/BalancedJs/contractSettings';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { VerticalDivider } from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as IconexIcon } from 'assets/icons/iconex.svg';
import { ReactComponent as LedgerIcon } from 'assets/icons/ledger.svg';
import bnJs from 'bnJs';
import { ApplicationModal } from 'store/application/actions';
import { useWalletModalToggle, useModalOpen, useChangeWalletType } from 'store/application/hooks';

//const displayAddress = (address: string) => `${address.slice(0, 10)}...${address.slice(-15)}`;

const displayAddress = (address: string) => `${address}`;

const generatePaths = (point: number) => {
  const paths = HwUtils.splitPath(`${LEDGER_BASE_PATH}/${point}'`);
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  return buffer;
};

const getAddress = async ({
  transport,
  paging: { offset, limit },
}: {
  transport: any;
  paging: {
    offset: number;
    limit: number;
  };
}): Promise<any[]> => {
  const result: any[] = [];
  for (let i = offset; i < offset + limit; i++) {
    const buffer = generatePaths(i);
    const response = await transport.send(0xe0, 0x02, 0x00, 0x01, buffer);

    const publicKeyLength = response[0];
    const addressLength = response[1 + publicKeyLength];

    result.push({
      publicKey: response.slice(1, 1 + publicKeyLength).toString('hex'),
      address: response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString(),
      chainCode: '',
      point: i,
    });
  }
  return result;
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
  const [addressList, updateAddressList] = useState([]);
  const [{ offset, limit }, updatePaging] = useState({
    offset: 0,
    limit: LIMIT_PAGING_LEDGER,
  });
  const changeWalletType = useChangeWalletType();

  const toggleShowledgerAddress = useCallback(() => {
    updateShowledgerAddress(!showLedgerAddress);
  }, [showLedgerAddress, updateShowledgerAddress]);

  const { requestAddress, hasExtension } = useIconReact();

  const handleOpenWallet = () => {
    toggleWalletModal();
    requestAddress();
  };

  const handleOpenLedger = async () => {
    changeWalletType('LEDGER');
    try {
      const transport = await TransportWebUSB.create();
      toggleShowledgerAddress();

      const result: any = await getAddress({
        transport,
        paging: {
          offset,
          limit,
        },
      });
      updateAddressList(result);
      bnJs.inject({
        legerSettings: {
          transport,
        },
      });
    } catch (err) {
      console.log(err);
      alert('Inject your ledger device, enter your password and retry');
    }
  };

  const getBack = () => {
    updatePaging({
      limit: LIMIT_PAGING_LEDGER,
      offset: offset - LIMIT_PAGING_LEDGER,
    });
  };

  const getNext = () => {
    updatePaging({
      limit: LIMIT_PAGING_LEDGER,
      offset: offset + LIMIT_PAGING_LEDGER,
    });
  };

  const chooseLedgerAddress = ({ address, point }: { address: string; point: number }) => {
    console.info(address);
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
    toggleShowledgerAddress();
    toggleWalletModal();
  };

  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleWalletModal}>
        <Box mx="auto" my={5}>
          <Typography textAlign="center" mb={5}>
            Sign in with:
          </Typography>

          <Flex alignItems="stretch" justifyContent="space-between" mx={3}>
            {hasExtension ? (
              <WalletOption onClick={handleOpenWallet}>
                <IconexIcon width="50" height="50" />
                <Text>ICONex</Text>
              </WalletOption>
            ) : (
              <WalletOption
                as="a"
                href="https://chrome.google.com/webstore/detail/iconex/flpiciilemghbmfalicajoolhkkenfel?hl=en"
              >
                <IconexIcon width="50" height="50" />
                <Text>ICONex</Text>
              </WalletOption>
            )}

            <VerticalDivider text="or"></VerticalDivider>

            <WalletOption onClick={handleOpenLedger}>
              <LedgerIcon width="50" height="50" />
              <Text>Ledger</Text>
            </WalletOption>
          </Flex>

          <Typography mx={4} mt={6} textAlign="center">
            Use at your own risk. Money lost via liquidation or a smart contract bug cannot be recovered.
          </Typography>
        </Box>
      </StyledModal>

      <LedgerAddressList isOpen={showLedgerAddress} onDismiss={toggleShowledgerAddress}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3}>
            Choose a wallet from your Ledger:
          </Typography>
          <table className="wallet">
            <tbody>
              {addressList.map((address: any) => {
                return (
                  <tr
                    onClick={() => {
                      chooseLedgerAddress({
                        address: address.address,
                        point: address.point,
                      });
                    }}
                  >
                    <td>{displayAddress(address.address)}</td>
                    <td>ICX</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ul className="pagination">
            <li onClick={getBack}>˂</li>
            <li onClick={getNext}>˃</li>
          </ul>
        </Flex>
      </LedgerAddressList>
    </>
  );
}
