import React, { useEffect, useState } from 'react';

import { chainConfigs, chainList, getCustomizedChainList, getTokenList } from 'btp/src/connectors/chainConfigs';
import { ADDRESS_LOCAL_STORAGE } from 'btp/src/connectors/constants';
import { addICONexListener } from 'btp/src/connectors/ICONex';
import { requestHasAddress } from 'btp/src/connectors/ICONex/events';
import { toCheckAddress } from 'btp/src/connectors/MetaMask/utils';
import { useTokenBalance } from 'btp/src/hooks/useTokenBalance';
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
  const [nativeCoin, setNativeCoin] = useState('');
  const [assetName, setAssetName] = useState('');
  const [balanceOfAssetName, setBalanceOfAssetName] = useState(0);
  const [sendingAddress, setSendingAddress] = useState('');
  const [sendingBalance, setSendingBalance] = useState(0);
  const [networkId, setNetworkId] = useState('');
  const [isOpenAssetOptions, setIsOpenAssetOptions] = useState(false);
  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const toggleWalletModal = useBridgeWalletModalToggle();
  const [, setSendingInfo] = useState({ token: '', network: '' });
  const [percent, setPercent] = React.useState<number>(0);

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
      const { balance, symbol, id } = window['accountInfo'];
      setAssetName(symbol);
      setNetworkId(id);
      setNativeCoin(symbol);
      setBalanceOfAssetName(balance || 0);
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
    return chainList.map(({ CHAIN_NAME, id, ...others }) => ({
      value: id,
      label: CHAIN_NAME,
      ...others,
    }));
  };

  const getTargetChains = () => {
    const targetChains = chainInfo();

    if (!nativeCoin) return targetChains;
    if (nativeCoin !== chainConfigs.ICON.COIN_SYMBOL) {
      return targetChains.filter(({ value }) => value === chainConfigs.ICON.id);
    }
    return targetChains;
  };

  const getOptions = () => {
    const options = [...getCustomizedChainList(), ...getTokenList()].map(
      ({ CHAIN_NAME, COIN_SYMBOL, symbol, tokenOf, ...others }) => {
        const tokenSymbol = COIN_SYMBOL || symbol;

        return {
          value: tokenSymbol,
          label: tokenSymbol,
          balance: 0,
          ...others,
        };
      },
    );

    if (!nativeCoin || networkId === chainConfigs.ICON.id) {
      return options;
    }

    return options.filter(
      option => option.id === networkId || option.id === chainConfigs.ICON.id || networkId === option.chainId,
    );
  };

  const userAssets = useTokenBalance(getOptions());
  const onChangeAsset = asset => {
    setAssetName(asset.value);
    setBalanceOfAssetName(asset.balance);
  };

  const handlePercentSelect = (percent: number) => {
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
                  data={getTargetChains()}
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
                  setBalance={setSendingBalance}
                  onPercentSelect={(percent: number) => handlePercentSelect(percent)}
                  percent={percent}
                />
              </Box>

              {isOpenAssetOptions && <AssetModal data={userAssets} onChange={onChangeAsset} />}
              <TransferAssetModal
                isOpen={isOpenConfirm}
                setIsOpen={setIsOpenConfirm}
                sendingAddress={sendingAddress}
                balance={sendingBalance}
                tokenSymbol={assetName}
              />
              <Box className="full-width">
                <Address onChange={setSendingAddress} />
              </Box>
            </Grid>

            <Divider margin={'20px 0'} />
            <Flex justifyContent={'center'}>
              <TextButton onClick={toggleTransferAssetsModal}>Cancel</TextButton>
              <Button disabled={!sendingBalance || !toCheckAddress(sendingAddress)} onClick={() => handleTransfer()}>
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
