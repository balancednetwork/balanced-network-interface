import React from 'react';

import { CONNECTED_WALLET_LOCAL_STORAGE } from '@/btp/src/connectors/constants';
import { requestAddress } from '@/btp/src/connectors/ICONex/events';
import { EthereumInstance } from '@/btp/src/connectors/MetaMask';
import { useNextFromNetwork, useSelectNetworkDst, useSelectNetworkSrc } from '@/btp/src/store/bridge/hooks';
import { wallets } from '@/btp/src/utils/constants';
// import { BalancedJs } from '@/packages/BalancedJs';
import { Trans } from 'react-i18next';
import { Box, Flex, Text } from 'rebass/styled-components';
import styled from 'styled-components';

// import { VerticalDivider } from '@/app/components/Divider';
import Modal, { ModalProps } from '@/app/components/Modal';
// import Spinner from '@/app/components/Spinner';
import { Typography } from '@/app/theme';
import IconWalletIcon from '@/assets/icons/wallets/iconex.svg';
import MetamaskIcon from '@/assets/icons/wallets/metamask.svg';

// const displayAddress = (address: string) => `${address.slice(0, 9)}...${address.slice(-7)}`;

const StyledModal = styled(({ mobile, ...rest }: ModalProps & { mobile?: boolean }) => <Modal {...rest} />)`
  &[data-reach-dialog-content] {
    ${({ mobile, theme }) =>
      !mobile &&
      `
      width: 320px;

      @media (min-width: 360px) {
        width: 100%;
        max-width: 300px;
      }
    `}
  }
`;

const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px 20px;
  margin: 0px auto;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;

  ${({ theme }) => theme.mediaWidth.up420`
    width: 140px;
  `};

  > *:first-child {
    margin-bottom: 10px;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
  &:after {
    content: '';
    display: block;
    width: 0px;
    height: 1px;
    margin-top: 3px;
    background: transparent;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  &:hover:after {
    width: 70%;
    background: #2fccdc;
  }

  ${({ disabled }) =>
    disabled &&
    `
      cursor: initial;
      opacity: 0.5;
      pointer-events: none;
      &:hover {
        background-color: transparent;
        &:after {
          background: transparent;
        }
      }
    `};
`;

const Wrapper = styled.div`
  width: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export default function BridgeWalletModal({ walletModalOpen, setOpenWalletModal }) {
  // const [loading, setLoading] = useState(false);
  // const [addressList, updateAddressList] = useState<any>([]);
  const nextFromNetwork = useNextFromNetwork();
  const setSelectNetworkSrc = useSelectNetworkSrc();
  const setNetworkDst = useSelectNetworkDst();

  const handleOpenWallet = async (type: string) => {
    // setLoading(true);
    // window['accountInfo'] = null;

    try {
      switch (type) {
        case wallets.metamask: {
          const isConnected = await EthereumInstance.connectMetaMaskWallet();
          console.log('isConnected', isConnected);
          if (isConnected) {
            await EthereumInstance.getEthereumAccounts();
            localStorage.setItem(CONNECTED_WALLET_LOCAL_STORAGE, type);
            console.log('nextFromNetwork', nextFromNetwork);
            setSelectNetworkSrc(nextFromNetwork);
            setNetworkDst('');
            // setLoading(false);
          }
          setOpenWalletModal();
          break;
        }
        case wallets.iconex:
        case wallets.hana: {
          const hasAccount = await requestAddress();
          if (hasAccount) {
            localStorage.setItem(CONNECTED_WALLET_LOCAL_STORAGE, type);
            setSelectNetworkSrc(nextFromNetwork);
            setNetworkDst('');
            // setLoading(false);
          }
          setOpenWalletModal();

          break;
        }
        default:
          break;
      }
    } catch {}
  };

  // const resolveBalanceByAddress = async (addressList: any[]) => {
  //   const data = await Promise.all(
  //     addressList.map((address: any) => {
  //       return new Promise((resolve, reject) => {
  //         bnJs.ICX.balanceOf(address.address)
  //           .then(balance => {
  //             resolve({
  //               ...address,
  //               balance: BalancedJs.utils.toIcx(balance.toFixed()).toFixed(2),
  //             });
  //           })
  //           .catch(reject);
  //       });
  //     }),
  //   );

  //   updateAddressList(data);
  // };

  // function getPageNumbers(index: number) {
  //   return index - 1 <= 0 ? [1, 2, 3] : [index - 1, index, index + 1];
  // }

  return (
    // <>
    <StyledModal isOpen={walletModalOpen} onDismiss={setOpenWalletModal} maxWidth={430}>
      <Wrapper>
        <Typography textAlign="center" mb={1}>
          <Trans>Connect your wallet</Trans>:
        </Typography>

        <Flex alignItems="stretch" justifyContent="space-between">
          {nextFromNetwork.value === 'ICON' ? (
            <WalletOption onClick={() => handleOpenWallet('iconex')}>
              <IconWalletIcon width="50" height="50" />
              <Text textAlign="center">ICON</Text>
            </WalletOption>
          ) : (
            <WalletOption onClick={() => handleOpenWallet('metamask')}>
              <MetamaskIcon width="50" height="50" />
              <Text textAlign="center">MetaMask</Text>
            </WalletOption>
          )}
        </Flex>
      </Wrapper>
    </StyledModal>
  );
}
