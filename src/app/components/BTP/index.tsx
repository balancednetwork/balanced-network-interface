import React, { useEffect, useState } from 'react';

import { Action } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import { chainConfigs, chainList, getCustomizedChainList, getTokenList } from 'btp/src/connectors/chainConfigs';
import { ADDRESS_LOCAL_STORAGE } from 'btp/src/connectors/constants';
import { addICONexListener } from 'btp/src/connectors/ICONex';
import { getBTPfee } from 'btp/src/connectors/ICONex/ICONServices';
import { toCheckAddress } from 'btp/src/connectors/MetaMask/utils';
import { useTokenBalance } from 'btp/src/hooks/useTokenBalance';
import store, { BTPAppDispatch, BTPContext, useBTPDispatch, useBTPSelector } from 'btp/src/store';
import { useFromNetwork, useSelectNetworkDst, useSelectNetworkSrc, useToNetwork } from 'btp/src/store/bridge/hooks';
import { accountSelector, setAccountInfo } from 'btp/src/store/models/account';
import { Trans } from 'react-i18next';
import { Provider } from 'react-redux';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal, { ModalProps } from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as ArrowIcon } from 'assets/icons/arrow.svg';
import { useModalOpen, useTransferAssetsModalToggle } from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';
import { EVENTS, on, off } from 'utils/customEvent';

import { ExternalLink } from '../SearchModal/components';
import Address from './Address';
import { AssetModal } from './AssetModal';
import AssetToTransfer from './AssetToTransfer';
import BridgeWalletModal from './BridgeWalletModal';
import NetworkSelector, { Label } from './NetworkSelector';
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

const FlexSelector = styled(Flex)`
  gap: 20px;
  margin-top: 30px;
  align-items: center;
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
        overflow: initial;
      }
    `}
  }
`;

const BetaText = styled(Typography)`
  color: #fc6a6a;
`;
const FeeAmount = styled(Typography)`
  color: #c0c9d2;
`;
addICONexListener();

const BTPContent = () => {
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const isOpenTransferAssetsModal = useModalOpen(ApplicationModal.TRANSFER_ASSETS);
  const [nativeCoin, setNativeCoin] = useState('');
  const [assetName, setAssetName] = useState('');
  const [balanceOfAssetName, setBalanceOfAssetName] = useState(0);
  const [sendingAddress, setSendingAddress] = useState('');
  const [sendingBalance, setSendingBalance] = useState('');
  const [networkId, setNetworkId] = useState('');
  const [isOpenAssetOptions, setIsOpenAssetOptions] = useState(false);
  const [walletModalOpen, setOpenWalletModal] = useState(false);

  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const [, setSendingInfo] = useState({ token: '', network: '' });
  const [percent, setPercent] = React.useState<number>(0);
  const [fee, setFee] = useState('0');
  const { accountInfo } = useBTPSelector(accountSelector);
  const setNetworkSrc = useSelectNetworkSrc();
  const setNetworkDst = useSelectNetworkDst();
  const dispatch = useBTPDispatch<BTPAppDispatch>();

  const toggleWalletModalOpen = () => {
    setOpenWalletModal(!walletModalOpen);
  };

  const onSendingInfoChange = (info = {}) => {
    setSendingInfo(sendingInfo => ({ ...sendingInfo, ...info }));
  };

  const handleTransfer = () => {
    setIsOpenConfirm(true);
  };

  useEffect(() => {
    if (isOpenTransferAssetsModal) {
      localStorage.removeItem(ADDRESS_LOCAL_STORAGE);
      resetForm();
      setNetworkDst('');
      setNetworkSrc('');
      dispatch(setAccountInfo(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenTransferAssetsModal]);

  const getFee = async tokenSymbol => {
    const BTPFee = await getBTPfee(tokenSymbol);
    setFee(BTPFee);
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

  useEffect(() => {
    const { balance = 0, symbol = '', id = '' } = accountInfo || {};

    const assestName = symbol || getOptions()[0].label;
    setAssetName(assestName);
    setNetworkId(id);
    setNativeCoin(symbol);
    setBalanceOfAssetName(Number(balance));
    getFee(symbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountInfo?.symbol, accountInfo?.id, accountInfo?.balance]);

  const fromNetwork = useFromNetwork();
  const toNetwork = useToNetwork();
  useEffect(() => {
    if (!fromNetwork) setAssetName(getOptions()[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromNetwork]);

  useEffect(() => {
    if (!walletModalOpen) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletModalOpen]);

  const resetForm = () => {
    setSendingAddress('');
    setSendingBalance('');
  };

  const chainInfo = () => {
    return chainList.map(({ CHAIN_NAME, id, ...others }) => ({
      value: id,
      label: CHAIN_NAME,
      ...others,
    }));
  };

  const userAssets = useTokenBalance(getOptions())
    .filter((asset: any) => asset?.balance !== 0)
    .reduce((accumulator: any, value: any) => {
      const nextIndex = accumulator.findIndex((i: any) => value?.balance > i?.balance);
      const index = nextIndex > -1 ? nextIndex : accumulator.length;
      accumulator.splice(index, 0, value);
      return accumulator;
    }, []);

  const onChangeAsset = async asset => {
    setAssetName(asset.value);
    setBalanceOfAssetName(asset.balance);
    getFee(asset.value);
  };

  const handlePercentSelect = (percent: number) => {
    setPercent(percent);
  };

  const isInsufficient = new BigNumber(fee).plus(sendingBalance).isGreaterThan(balanceOfAssetName);
  const isEmpty = !sendingAddress || !balanceOfAssetName;
  const isLessThanFee = new BigNumber(sendingBalance).isLessThan(new BigNumber(fee));

  return (
    <>
      <StyledModal
        isOpen={isOpenTransferAssetsModal}
        onDismiss={() => {
          !fromNetwork && toggleTransferAssetsModal();
        }}
        maxWidth={525}
      >
        <Wrapper>
          <Flex flexDirection={'column'} width={'100%'}>
            <Typography variant={'h2'}>
              <Trans>Transfer assets </Trans>
              <BetaText variant="span">
                <strong>
                  <Trans>Beta </Trans>
                </strong>
              </BetaText>
            </Typography>
            <Typography padding={'10px 0'}>
              <Trans> Move assets between ICON and other blockchains. </Trans>
              <ExternalLink href="https://docs.balanced.network/user-guide/transfer-cross-chain" target="_blank">
                <Trans>Learn more.</Trans>
              </ExternalLink>
            </Typography>

            <FlexSelector width={'100%'}>
              <Box className="content">
                <NetworkSelector
                  placeholder="From blockchain"
                  label="From"
                  data={chainInfo()}
                  toggleWallet={toggleWalletModalOpen}
                />
              </Box>
              <ArrowIcon width="20" height="18" />
              <Box className="content">
                <NetworkSelector
                  placeholder="To blockchain"
                  label="To"
                  data={chainInfo()}
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
                  balance={sendingBalance}
                  onPercentSelect={(percent: number) => handlePercentSelect(percent)}
                  percent={percent}
                  fee={fee}
                />
                {isOpenAssetOptions && (
                  <AssetModal data={userAssets.length > 0 ? userAssets : getOptions()} onChange={onChangeAsset} />
                )}
              </Box>

              <TransferAssetModal
                isOpen={isOpenConfirm}
                setIsOpen={setIsOpenConfirm}
                handleResetForm={resetForm}
                sendingAddress={sendingAddress}
                balance={sendingBalance}
                tokenSymbol={assetName}
                fee={fee}
              />
              <Box className="full-width">
                <Address address={sendingAddress} onChange={setSendingAddress} />
                {fromNetwork && (
                  <Flex justifyContent={'end'}>
                    <Label atBottom>
                      Transfer fee:{' '}
                      <FeeAmount variant="span">
                        <strong>
                          {fee} {assetName}
                        </strong>
                      </FeeAmount>
                    </Label>
                  </Flex>
                )}
              </Box>
            </Grid>
            <Divider margin={'20px 0'} />
            <Flex justifyContent={'center'}>
              <TextButton onClick={toggleTransferAssetsModal}>Cancel</TextButton>
              <Button
                disabled={
                  !sendingBalance ||
                  isEmpty ||
                  !toCheckAddress(sendingAddress) ||
                  isInsufficient ||
                  isLessThanFee ||
                  !fromNetwork ||
                  !toNetwork
                }
                onClick={() => handleTransfer()}
              >
                {isInsufficient ? `Insufficient ${assetName}` : 'Transfer'}
              </Button>
            </Flex>
            {isLessThanFee && (
              <Typography textAlign="center" paddingTop={'10px'} color="#F05365">
                Transfer amount must be greater than {fee} for the token fee.
              </Typography>
            )}
            <Typography textAlign="center" paddingTop={'10px'}>
              ICON Bridge is undergoing a security audit. Use at your own risk.
            </Typography>
          </Flex>
        </Wrapper>
        <BridgeWalletModal walletModalOpen={walletModalOpen} setOpenWalletModal={toggleWalletModalOpen} />
      </StyledModal>
    </>
  );
};

const BTP = () => {
  const dispatch = useBTPDispatch<BTPAppDispatch>();
  useEffect(() => {
    const dispatchFnc = ({ detail }: { detail: { action: Action } }) => {
      console.log(detail.action);
      dispatch(detail.action);
    };
    dispatch(
      setAccountInfo({
        address: 'hx1b57ca63337d35f7880612a7f08b03d3bc2bf565',
        balance: 0,
        wallet: 'iconex',
        symbol: 'ICX',
        currentNetwork: 'ICON',
        id: 'ICON',
      }),
    );
    on(EVENTS.DISPATCH, dispatchFnc);
    return () => {
      off(EVENTS.DISPATCH, dispatchFnc);
    };
  }, [dispatch]);

  return (
    <Provider store={store} context={BTPContext}>
      <BTPContent />
    </Provider>
  );
};

export default BTP;
