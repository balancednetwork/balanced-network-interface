import React, { useEffect, useState } from 'react';

// import { Select } from 'components/Select';

import Hana from 'btp/src/assets/images/hana-wallet.png';
import ICONex from 'btp/src/assets/images/icon-ex.svg';
import MetaMask from 'btp/src/assets/images/metal-mask.svg';
import NEAR from 'btp/src/assets/images/near-icon.svg';
import { Avatar } from 'btp/src/components/Avatar';
import { Modal } from 'btp/src/components/NotificationModal';
import { SuccessSubmittedTxContent } from 'btp/src/components/NotificationModal/SuccessSubmittedTxContent';
import { SubTitle, Text } from 'btp/src/components/Typography';
import { CONNECTED_WALLET_LOCAL_STORAGE } from 'btp/src/connectors/constants';
// import { requestAddress, isICONexInstalled, checkICONexInstalled } from 'btp/src/connectors/ICONex/events';
import { requestAddress } from 'btp/src/connectors/ICONex/events';
import { resetTransferStep } from 'btp/src/connectors/ICONex/utils';
import { EthereumInstance } from 'btp/src/connectors/MetaMask';
import { useDispatch, useSelect } from 'btp/src/hooks/useRematch';
import { toSeparatedNumberString, hashShortener } from 'btp/src/utils/app';
import { wallets, PAIRED_NETWORKS, getPairedNetwork, pairedNetworks } from 'btp/src/utils/constants';

import { Button } from 'app/components/Button';

import { WalletDetails } from './WalletDetails';
import { WalletSelector } from './WalletSelector';
// import logo from 'assets/images/logo-nexus-white.png';

// const PairedNetworkWrapper = styled.div`
//   display: flex;
//   justify-content: left;
//   align-items: center;
// `;

// const Logo = styled.img`
//   width: 42.65px;
// `;

const mockWallets = {
  [wallets.metamask]: {
    id: 'metamask',
    title: 'MetaMask Wallet',
    icon: MetaMask,
  },
  [wallets.iconex]: {
    id: 'iconex',
    title: 'ICONex Wallet',
    icon: ICONex,
  },
  [wallets.hana]: {
    id: 'hana',
    title: 'Hana Wallet',
    icon: Hana,
  },
  // [wallets.near]: {
  //   id: 'near',
  //   title: 'NEAR Wallet',
  //   icon: NEAR,
  // },
};

const WalletConnect = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(
    localStorage.getItem(CONNECTED_WALLET_LOCAL_STORAGE) || wallets.metamask,
  );
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  // const [checkingICONexInstalled, setCheckingICONexInstalled] = useState(true);
  const currentPairedNetworks = getPairedNetwork();

  const { openModal, setDisplay } = useDispatch(({ modal: { openModal, setDisplay } }) => ({
    openModal,
    setDisplay,
  }));

  // const pairedNetworksOptions = [
  //   { label: currentPairedNetworks, value: currentPairedNetworks },
  //   ...Object.keys(pairedNetworks)
  //     .filter((i) => i !== currentPairedNetworks)
  //     .map((i) => ({ label: i, value: i })),
  // ];

  useEffect(() => {
    switch (localStorage.getItem(CONNECTED_WALLET_LOCAL_STORAGE)) {
      case wallets.metamask:
        EthereumInstance.getEthereumAccounts();
        break;
      default:
        return;
    }
    // wait after 2s for initial addICONexListener
    // setTimeout(() => {
    //   checkICONexInstalled(() => {
    //     setCheckingICONexInstalled(false);
    //   });
    // }, 2001);
  }, []);

  const {
    accountInfo: { address, balance, unit, wallet, cancelConfirmation, currentNetwork },
  } = useSelect(({ account }) => ({
    accountInfo: account.selectAccountInfo,
  }));

  const { resetAccountInfo } = useDispatch(({ account: { resetAccountInfo } }) => ({
    resetAccountInfo,
  }));

  const shortedAddress = hashShortener(address);

  const toggleModal = () => {
    setShowModal(prev => !prev);
    setShowDetail(false);
  };

  const handleConnect = async e => {
    e.preventDefault();
    setLoading(true);
    resetAccountInfo();
    localStorage.setItem(CONNECTED_WALLET_LOCAL_STORAGE, selectedWallet);

    switch (selectedWallet) {
      case wallets.iconex:
      case wallets.hana:
        const hasAccount = requestAddress();
        if (!hasAccount) {
          setLoading(false);
        }
        break;

      case wallets.metamask:
        const isConnected = await EthereumInstance.connectMetaMaskWallet();
        if (isConnected) {
          await EthereumInstance.getEthereumAccounts();
        }
        setLoading(false);
        break;

      default:
        return;
    }
  };
  const handleSelectWallet = wallet => {
    if (wallet) setSelectedWallet(wallet);

    // if (wallet === wallets.near) {
    //   onChangePairedNetworks({ target: { value: pairedNetworks['ICON-NEAR'] } });
    // }
  };

  const onDisconnectWallet = () => {
    resetTransferStep();
    resetAccountInfo();
    toggleModal();
  };

  const onSwitchWallet = () => {
    resetTransferStep();
    setShowDetail(false);
  };

  const onAvatarClicked = () => {
    setShowDetail(true);
    setShowModal(true);
  };

  const onChangePairedNetworks = e => {
    const { value } = e.target;
    localStorage.setItem(PAIRED_NETWORKS, value);
  };

  useEffect(() => {
    // handle callback url from NEAR wallet
    // https://docs.near.org/docs/api/naj-quick-reference#sign-in
    const { search, pathname } = window.location;

    if (search.startsWith('?near=true') && address) {
      setShowDetail(true);
      setShowModal(true);
      window.history.replaceState(null, '', pathname);
    }

    if (search.startsWith('?transactionHashes=')) {
      openModal({
        icon: 'checkIcon',
        children: <SuccessSubmittedTxContent />,
        button: {
          text: 'Continue transfer',
          onClick: () => setDisplay(false),
        },
      });

      window.history.replaceState(null, '', pathname);
    }

    if (address) {
      setLoading(false);
      setShowDetail(true);
    }
  }, [address, openModal, setDisplay]);

  // set default paired networks
  useEffect(() => {
    if (!currentPairedNetworks) {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);
    }
  }, [currentPairedNetworks]);

  return (
    <div>
      {address ? (
        <div className="account-info">
          <SubTitle className="sm">{currentNetwork}</SubTitle>
          <Avatar className="user-avatar" size={48} onClick={onAvatarClicked} />
          <span className="wallet-info">
            <Text className="xs address">{shortedAddress}</Text>
            <SubTitle className="md bold">
              {toSeparatedNumberString(balance)} {unit}
            </SubTitle>
          </span>
        </div>
      ) : (
        <Button onClick={toggleModal}>Connect a Wallet</Button>
      )}
      {showModal && (
        <>
          {loading && !cancelConfirmation ? (
            <Modal icon="loader" desc="Please wait a moment." width="352px" display setDisplay={setShowModal} />
          ) : showDetail ? (
            <Modal display setDisplay={setShowModal} title={wallet && mockWallets[wallet].title}>
              <WalletDetails
                networkName={currentNetwork}
                unit={unit}
                address={address}
                shortedAddress={shortedAddress}
                onDisconnectWallet={onDisconnectWallet}
                onSwitchWallet={onSwitchWallet}
              />
            </Modal>
          ) : (
            <Modal
              title="Connect a wallet"
              button={{ onClick: handleConnect, text: 'Next' }}
              display
              setDisplay={setShowModal}
            >
              <div className="connect-a-wallet-card">
                <WalletSelector
                  type={wallets.metamask}
                  wallet={mockWallets}
                  active={selectedWallet === wallets.metamask}
                  onClick={() => handleSelectWallet(wallets.metamask)}
                  isInstalled={EthereumInstance.isMetaMaskInstalled()}
                />
                {/* <WalletSelector
                  type={wallets.iconex}
                  wallet={mockWallets}
                  active={selectedWallet === wallets.iconex}
                  onClick={() => handleSelectWallet(wallets.iconex)}
                  isCheckingInstalled={checkingICONexInstalled}
                  isInstalled={isICONexInstalled()}
                />
                <WalletSelector
                  type={wallets.hana}
                  wallet={mockWallets}
                  active={selectedWallet === wallets.hana}
                  onClick={() => handleSelectWallet(wallets.hana)}
                  isCheckingInstalled={checkingICONexInstalled}
                  isInstalled={isICONexInstalled()}
                /> */}
                {/* <WalletSelector
                  type={wallets.near}
                  wallet={mockWallets}
                  active={selectedWallet == wallets.near}
                  onClick={() => handleSelectWallet(wallets.near)}
                  isInstalled
                /> */}
              </div>
              {/* {wallets.near !== selectedWallet && (
                <PairedNetworkWrapper>
                  <Text className="xs" color={colors.graySubText}>
                    Select the paired networks:
                  </Text>
                  <Select options={pairedNetworksOptions} onChange={onChangePairedNetworks} />
                </PairedNetworkWrapper>
              )} */}
            </Modal>
          )}
        </>
      )}
      {/* <Logo src={logo} alt="btp logo" /> */}
    </div>
  );
};

export default WalletConnect;
