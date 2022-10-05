import React, { useEffect, useState } from 'react';

import { chainConfigs, chainList, getTokenList } from 'btp/src/connectors/chainConfigs';
import { ADDRESS_LOCAL_STORAGE } from 'btp/src/connectors/constants';
import { addICONexListener } from 'btp/src/connectors/ICONex';
import { requestHasAddress } from 'btp/src/connectors/ICONex/events';
import { toCheckAddress } from 'btp/src/connectors/MetaMask/utils';
//import { useTokenBalance } from 'btp/src/hooks/useTokenBalance';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal, { ModalProps } from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as ArrowIcon } from 'assets/icons/arrow.svg';
import { useModalOpen, useTransferAssetsModalToggle, useBridgeWalletModalToggle } from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';

import Address from './Address';
import { AssetModal } from './AssetModal';
import AssetToTransfer from './AssetToTransfer';
import NetworkSelector from './NetworkSelector';
import { TransferAssetModal } from './TransferModal';

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
  margin-top: 15px;

  .full-width {
    grid-column: span 2;
  }
`;

const Wrapper = styled.div`
  width: 100%;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FlexSelector = styled(Box)`
  gap: 20px;
  display: flex;
  margin-top: 30px;
  .content {
    flex: 1;
  }
`;

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
        max-width: 525px;
        z-index: 1500;
      }
    `}
  }
`;
addICONexListener();

const BTP = () => {
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const walletModalOpen = useModalOpen(ApplicationModal.TRANSFER_ASSETS);
  const [nativeCoin, setNativeCoin] = useState('ICX');
  const [assetName, setAssetName] = useState('');
  const [balanceOfAssetName, setBalanceOfAssetName] = useState(0);
  const [sendingAddress, setSendingAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [networkId, setNetworkId] = useState('0x7');
  const [isOpenAssetOptions, setIsOpenAssetOptions] = useState(false);
  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const toggleWalletModal = useBridgeWalletModalToggle();
  const [sendingInfo, setSendingInfo] = useState({ token: '', network: '' });
  const [assetOptions, setAssetOptions] = useState([]);

  const onSendingInfoChange = (info = {}) => {
    setSendingInfo(sendingInfo => ({ ...sendingInfo, ...info }));
  };

  const handleTransfer = () => {
    setIsOpenConfirm(true);
  };

  useEffect(() => {
    const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
    if (address) {
      setTimeout(() => {
        requestHasAddress(address);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (window['accountInfo'] != null) {
      const { balance, symbol } = window['accountInfo'];
      setAssetName(symbol);
      setBalanceOfAssetName(balance);
    }
  }, [window['accountInfo']]);

  const onChange = values => {
    // const {
    //   target: { value, name },
    // } = values;
    // if (name) {
    //   setSendingInfo({ [name]: value } as any);
    // }
  };

  const chainInfo = () => {
    const lala = chainList.map(({ CHAIN_NAME, id, ...others }) => ({
      value: id,
      label: CHAIN_NAME,
      ...others,
    }));
    return lala;
  };

  const getTartgetChains = () => {
    /*
    We have 8 transfer cases supported for now => explain the options of dropdowns

    [From ICON]
    Transfer ICX to BSC
    Transfer BNB to BSC
    Transfer ICX to Harmony
    Transfer ONE to Harmony

    [From BSC]
    Transfer BNB to ICON
    Transfer ICX to ICON

    [From Harmony]
    Transfer ONE to ICON
    Transfer ICX to ICON
    */
    const targetChains = chainInfo();

    if (!nativeCoin) return targetChains;
    if (nativeCoin !== chainConfigs.ICON.COIN_SYMBOL) {
      return targetChains.filter(({ value }) => value === chainConfigs.ICON.id);
    }
    // if (nativeCoin === chainConfigs.ICON.COIN_SYMBOL && sendingInfo.token === chainConfigs.ICON.COIN_SYMBOL) {
    //   return targetChains.filter(({ value }) => value !== chainConfigs.ICON.id);
    // } else {
    //   return targetChains.filter(({ COIN_SYMBOL }) => sendingInfo.token === COIN_SYMBOL);
    // }
    return targetChains;
  };

  const getAssetOptions = () => {
    const options = [...chainList, ...getTokenList()].map(({ CHAIN_NAME, COIN_SYMBOL, symbol, chain, ...others }) => {
      const tokenSymbol = COIN_SYMBOL || symbol;
      return {
        value: tokenSymbol,
        label: tokenSymbol,
        ...others,
      };
    });

    // if (!nativeCoin || networkId === chainConfigs.ICON.id) {
    //   return options;
    // }

    // return options.filter(
    //   option => option.id === networkId || option.id === chainConfigs.ICON.id || networkId === option.chainId,
    // );
    return options;
  };

  const coins = [...chainList, ...getTokenList()].map(({ CHAIN_NAME, COIN_SYMBOL, symbol, chain, ...others }) => {
    const tokenSymbol = COIN_SYMBOL || symbol;
    return {
      value: tokenSymbol,
      label: tokenSymbol,
      ...others,
    };
  });
  const coinNames: string[] = [...coins];
  //const balanceOf = useTokenBalance(coinNames);
  const balanceOf = 0;
  const onChangeAsset = asset => {
    setAssetName(asset.value);
    setBalanceOfAssetName(asset.balance);
  };

  const [percent, setPercent] = React.useState<number>(0);
  const handlePercentSelect = (field: string, percent: number) => {
    setPercent(percent);
  };
  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleTransferAssetsModal} maxWidth={525}>
        <Wrapper>
          <Flex flexDirection={'column'} width={'100%'}>
            <Typography variant={'h2'}>Transfer assets</Typography>
            <Typography padding={'10px 0'}>Move assets between ICON and other blockchains</Typography>
            <FlexSelector width={'100%'}>
              <Box className="content">
                <NetworkSelector label="From" data={chainInfo()} onChange={onChange} toggleWallet={toggleWalletModal} />
              </Box>
              <Box>
                <ArrowIcon width="20" height="18" />
              </Box>
              <Box className="content">
                <NetworkSelector
                  label="To"
                  data={getTartgetChains()}
                  onChange={onChange}
                  setSendingInfo={onSendingInfoChange}
                />
              </Box>
            </FlexSelector>
            <Grid>
              <Box className="full-width">
                <AssetToTransfer
                  assetName={assetName}
                  balanceOfAssetName={balanceOfAssetName}
                  toggleDropdown={() => {
                    setIsOpenAssetOptions(prevState => !prevState);
                  }}
                  closeDropdown={() => setIsOpenAssetOptions(false)}
                  setBalance={setBalance}
                  onPercentSelect={(percent: number) => handlePercentSelect(assetName, percent)}
                  percent={percent}
                />
              </Box>

              {isOpenAssetOptions && <AssetModal data={balanceOf} onChange={onChangeAsset} />}
              <TransferAssetModal
                isOpen={isOpenConfirm}
                setIsOpen={setIsOpenConfirm}
                sendingAddress={sendingAddress}
                balance={balance}
                tokenSymbol={assetName}
              />
              <Box className="full-width">
                <Address onChange={setSendingAddress} />
              </Box>
            </Grid>

            <Divider margin={'20px 0'} />
            <Flex justifyContent={'center'}>
              <TextButton onClick={toggleTransferAssetsModal}>Cancel</TextButton>
              <Button disabled={!balance || !toCheckAddress(sendingAddress)} onClick={() => handleTransfer()}>
                Transfer
              </Button>
            </Flex>
          </Flex>
        </Wrapper>
      </StyledModal>
    </>
  );
};

export default BTP;
