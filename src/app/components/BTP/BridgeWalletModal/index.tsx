import React from 'react';

import { CONNECTED_WALLET_LOCAL_STORAGE } from 'btp/src/connectors/constants';
import { requestAddress } from 'btp/src/connectors/ICONex/events';
import { EthereumInstance } from 'btp/src/connectors/MetaMask';
import { useNextFromNetwork, useSelectNetworkDst, useSelectNetworkSrc } from 'btp/src/store/bridge/hooks';
import { wallets } from 'btp/src/utils/constants';
// import { BalancedJs } from 'packages/BalancedJs';
// import { LEDGER_BASE_PATH } from 'packages/BalancedJs/contractSettings';
import { Trans } from 'react-i18next';
import { Box, Flex, Text } from 'rebass/styled-components';
import styled from 'styled-components';

// import { VerticalDivider } from 'app/components/Divider';
import Modal, { ModalProps } from 'app/components/Modal';
// import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as IconWalletIcon } from 'assets/icons/iconex.svg';
// import { ReactComponent as LedgerIcon } from 'assets/icons/ledger.svg';
import { ReactComponent as MetamaskIcon } from 'assets/icons/metamask.svg';
// import { useChangeCurrentLedgerAddressPage, useCurrentLedgerAddressPage } from 'store/application/hooks';

// const displayAddress = (address: string) => `${address.slice(0, 9)}...${address.slice(-7)}`;

// const generatePaths = (point: number) => {
//   const paths = HwUtils.splitPath(`${LEDGER_BASE_PATH}/${point}'`);
//   const buffer = Buffer.alloc(1 + paths.length * 4);
//   buffer[0] = paths.length;
//   paths.forEach((element, index) => {
//     buffer.writeUInt32BE(element, 1 + 4 * index);
//   });
//   return buffer;
// };

// const requestLedgerAddress = async ({
//   paging: { offset, limit },
// }: {
//   paging: {
//     offset: number;
//     limit: number;
//   };
// }): Promise<any[]> => {
//   const addressFromLedger: any[] = [];

//   for (let i = offset; i < offset + limit; i++) {
//     const buffer = generatePaths(i);
//     const response = await bnJs.contractSettings.ledgerSettings.transport.send(0xe0, 0x02, 0x00, 0x01, buffer);

//     const publicKeyLength = response[0];
//     const addressLength = response[1 + publicKeyLength];

//     addressFromLedger.push({
//       publicKey: response.slice(1, 1 + publicKeyLength).toString('hex'),
//       address: response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString(),
//       chainCode: '',
//       point: i,
//       balance: '-',
//     });
//   }

//   return addressFromLedger;
// };

// const LIMIT_PAGING_LEDGER = 5;

// const LedgerAddressList = styled(Modal)`
//   width: 500px;
// `;

const StyledModal = styled(({ mobile, ...rest }: ModalProps & { mobile?: boolean }) => <Modal {...rest} />).attrs({
  'aria-label': 'dialog',
})`
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

  :hover {
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
      :hover {
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
  // const [showLedgerAddress, updateShowledgerAddress] = useState(false);
  // const [addressList, updateAddressList] = useState<any>([]);
  // const [isLedgerLoading, setLedgerLoading] = useState(false);
  // const [isLedgerErr, setIsLedgerErr] = useState(false);
  const nextFromNetwork = useNextFromNetwork();
  const setSelectNetworkSrc = useSelectNetworkSrc();
  const setNetworkDst = useSelectNetworkDst();

  // const [{ offset, limit }, updatePaging] = useState({
  //   offset: 0,
  //   limit: LIMIT_PAGING_LEDGER,
  // });
  // const currentLedgerAddressPage = useCurrentLedgerAddressPage();
  // const changeCurrentLedgerAddressPage = useChangeCurrentLedgerAddressPage();

  const handleOpenWallet = async (type: string) => {
    // setLoading(true);
    // window['accountInfo'] = null;

    try {
      switch (type) {
        case wallets.metamask:
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
        case wallets.iconex:
        case wallets.hana:
          const hasAccount = await requestAddress();
          if (hasAccount) {
            localStorage.setItem(CONNECTED_WALLET_LOCAL_STORAGE, type);
            setSelectNetworkSrc(nextFromNetwork);
            setNetworkDst('');
            // setLoading(false);
          }
          setOpenWalletModal();

          break;
        default:
          break;
      }
    } catch {}
  };

  // const updateLedgerAddress = React.useCallback(async ({ offset, limit }) => {
  //   const currentAddressList: any[] = await requestLedgerAddress({
  //     paging: {
  //       offset,
  //       limit,
  //     },
  //   });

  //   setIsLedgerErr(false);
  //   updateAddressList(currentAddressList);
  //   resolveBalanceByAddress(currentAddressList);
  // }, []);

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
  //   setLedgerLoading(false);
  // };

  // const handleOpenLedger = async () => {
  //   setLedgerLoading(true);
  //   setIsLedgerErr(false);
  //   updateAddressList([]);
  //   updatePaging({
  //     offset: 0,
  //     limit: LIMIT_PAGING_LEDGER,
  //   });
  //   const timeout = setTimeout(() => {
  //     setIsLedgerErr(true);
  //   }, 3 * 1000);
  //   try {
  //     if (bnJs.contractSettings.ledgerSettings.transport?.device?.opened) {
  //       bnJs.contractSettings.ledgerSettings.transport.close();
  //     }
  //     const transport = await TransportWebHID.create();
  //     transport.setDebugMode && transport.setDebugMode(false);
  //     bnJs.inject({
  //       legerSettings: {
  //         transport,
  //       },
  //     });
  //     updateShowledgerAddress(true);
  //     await updateLedgerAddress({ offset, limit });
  //     clearTimeout(timeout);
  //   } catch (err: any) {
  //     clearTimeout(timeout);
  //     if (err.id === 'InvalidChannel') {
  //       await bnJs.contractSettings.ledgerSettings.transport.close();
  //       return setTimeout(() => {
  //         handleOpenLedger();
  //       }, 0);
  //     }
  //     alert('Insert your ledger device, then enter your password and try again.');
  //   }
  // };

  // const getLedgerPage = React.useCallback(
  //   async (pageNum: number) => {
  //     updateAddressList([]);

  //     setLedgerLoading(true);
  //     setIsLedgerErr(false);

  //     const timeout = setTimeout(() => {
  //       setIsLedgerErr(true);
  //     }, 3 * 1000);

  //     if (pageNum <= 0) {
  //       // should disable page number < 0;
  //       console.log('This is first pages, cannot request more address, try other please.');
  //       return;
  //     }

  //     // disable current page
  //     if (pageNum === currentLedgerAddressPage) {
  //       return;
  //     }

  //     const next = (pageNum - 1) * limit;

  //     await updateLedgerAddress({ offset: next, limit });
  //     clearTimeout(timeout);

  //     // setLedgerLoading(false);
  //     setIsLedgerErr(false);

  //     updatePaging({
  //       limit,
  //       offset: next,
  //     });
  //     changeCurrentLedgerAddressPage(pageNum);
  //   },
  //   [limit, currentLedgerAddressPage, updatePaging, changeCurrentLedgerAddressPage, updateLedgerAddress],
  // );

  // const chooseLedgerAddress = ({ address, point }: { address: string; point: number }) => {
  //   requestAddress({
  //     address,
  //     point,
  //   });
  //   bnJs.inject({
  //     account: address,
  //     legerSettings: {
  //       path: getLedgerAddressPath(point),
  //     },
  //   });
  //   updateShowledgerAddress(false);
  //   toggleWalletModal();
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
          {/* <VerticalDivider text="or"></VerticalDivider>
          <WalletOption onClick={handleOpenLedger} disabled>
            <LedgerIcon width="50" height="50" />
            <Text textAlign="center">Ledger</Text>
          </WalletOption> */}
        </Flex>
      </Wrapper>
    </StyledModal>
    // <LedgerAddressList
    //   isOpen={showLedgerAddress}
    //   onDismiss={() => {
    //     if (isLedgerLoading) return;

    //     updateShowledgerAddress(false);
    //   }}
    // >
    //   <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
    //     <Typography textAlign="center" mb={3}>
    //       <Trans>Choose a wallet from your Ledger:</Trans>
    //     </Typography>
    //     {isLedgerLoading && (
    //       <Flex justifyContent="center">
    //         <Spinner></Spinner>
    //       </Flex>
    //     )}
    //     {isLedgerErr && (
    //       <Flex justifyContent="center" mt={4} mb={4}>
    //         <Typography>
    //           <Trans>Cancel any pending transactions on your Ledger, or give Chrome permission to use it.</Trans>
    //         </Typography>
    //       </Flex>
    //     )}
    //     {!isLedgerErr && (
    //       <>
    //         <table className="wallet">
    //           <tbody>
    //             {addressList.map((address: any) => {
    //               return (
    //                 <tr
    //                   key={address.point}
    //                   // onClick={() => {
    //                   //   chooseLedgerAddress({
    //                   //     address: address.address,
    //                   //     point: address.point,
    //                   //   });
    //                   // }}
    //                 >
    //                   <td style={{ textAlign: 'left' }}>{displayAddress(address.address)}</td>
    //                   <td style={{ textAlign: 'right' }}>{address.balance} ICX</td>
    //                 </tr>
    //               );
    //             })}
    //           </tbody>
    //         </table>
    //         {/* {!isLedgerLoading && (
    //           <ul className="pagination">
    //             <li
    //               onClick={async () => {
    //                 await getLedgerPage(currentLedgerAddressPage - 1);
    //               }}
    //             >
    //               ˂
    //             </li>
    //             {getPageNumbers(currentLedgerAddressPage).map(value => {
    //               return (
    //                 <li
    //                   key={Date.now() + Math.random()}
    //                   className={value === currentLedgerAddressPage ? 'actived' : ''}
    //                   onClick={async () => {
    //                     await getLedgerPage(value);
    //                   }}
    //                 >
    //                   {value}
    //                 </li>
    //               );
    //             })}
    //             <li
    //               onClick={async () => {
    //                 await getLedgerPage(currentLedgerAddressPage + 1);
    //               }}
    //             >
    //               ˃
    //             </li>
    //           </ul>
    //         )} */}
    //       </>
    //     )}
    //   </Flex>
    // </LedgerAddressList>
    //  </>
  );
}
