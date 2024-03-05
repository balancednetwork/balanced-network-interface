import React, { useEffect, useMemo, useState } from 'react';

import { Action } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';
import {
  chainConfigs,
  chainList,
  checkIRC2Token,
  getCustomizedChainList,
  getTokenList,
} from 'btp/src/connectors/chainConfigs';
import { CHAIN_NAME } from 'btp/src/connectors/chainCustomization';
import { ADDRESS_LOCAL_STORAGE } from 'btp/src/connectors/constants';
import { addICONexListener, setBalance } from 'btp/src/connectors/ICONex';
import { getBalance, getBTPfee } from 'btp/src/connectors/ICONex/ICONServices';
import { toCheckAddress } from 'btp/src/connectors/MetaMask/utils';
import { useGetBTPService } from 'btp/src/hooks/useService';
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
import { TransactionStatus } from 'store/transactions/hooks';
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
    position: relative;
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
    ${({ mobile }) =>
      !mobile &&
      `
      overflow: initial;
      width: 320px;

      @media (min-width: 360px) {
        width: 100%;
        max-width: 525px;
        z-index: 1500;
      }
    `}
  }
`;

const FeeAmount = styled(Typography)`
  color: #c0c9d2;
`;

const StyledExternalLink = styled(ExternalLink)`
  color: #2fccdc;
  text-decoration: none !important;
  &:hover {
    text-decoration: underline !important;
  }
`;
const StyledTextButton = styled(TextButton)`
  color: #2fccdc;
  padding: 0 !important;
  &:hover {
    text-decoration: underline !important;
    color: #2fccdc !important;
  }
`;

addICONexListener();

const BTPContent = () => {
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const isOpenTransferAssetsModal = useModalOpen(ApplicationModal.TRANSFER_ASSETS);
  const [assetName, setAssetName] = useState('');
  const [balanceOfAssetName, setBalanceOfAssetName] = useState(0);
  const [sendingAddress, setSendingAddress] = useState('');
  const [sendingBalance, setSendingBalance] = useState('');
  const [isOpenAssetOptions, setIsOpenAssetOptions] = useState(false);
  const [walletModalOpen, setOpenWalletModal] = useState(false);
  const [isRemovingFromContract, setIsRemovingFromContract] = useState<boolean>(false);

  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const [, setSendingInfo] = useState({ token: '', network: '' });
  const [percent, setPercent] = React.useState<number>(0);
  const [fee, setFee] = useState('0');
  const { accountInfo } = useBTPSelector(accountSelector);
  const { id: networkId, symbol: nativeCoin } = accountInfo || {};
  const setNetworkSrc = useSelectNetworkSrc();
  const setNetworkDst = useSelectNetworkDst();
  const fromNetwork = useFromNetwork();
  const toNetwork = useToNetwork();
  const dispatch = useBTPDispatch<BTPAppDispatch>();

  const getBTPService = useGetBTPService();

  const [appovedBalance, setApprovedBalance] = useState('');
  const isICONNetwork = fromNetwork.label === CHAIN_NAME.ICON;
  const shouldCheckIRC2Token = isICONNetwork && checkIRC2Token(assetName);

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
    setFee(BTPFee ? `${BTPFee}` : '0');
  };

  const checkApprovedBalance = async () => {
    if (!shouldCheckIRC2Token || !accountInfo?.address) {
      setApprovedBalance('');
      return;
    }

    const result = (await getBTPService()?.getBalanceOf({
      address: accountInfo?.address,
      symbol: assetName,
      approved: true,
    })) as string;

    setApprovedBalance(result === '0' ? '' : result);
  };

  const defaultOptions = useMemo(() => {
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
  }, [nativeCoin, networkId]);

  const userAssets = useTokenBalance(defaultOptions);

  const tokenList = useMemo(() => {
    // NOTE: it should update after userAssets update, userAssets should be updated after wallet was changed or completed transfer transaction
    if (userAssets.length > 0 && fromNetwork) {
      const assets: any[] = userAssets
        .filter((asset: any) => asset?.balance !== 0)
        .reduce((accumulator: any, value: any) => {
          const nextIndex = accumulator.findIndex((i: any) => value?.balance > i?.balance);
          const index = nextIndex > -1 ? nextIndex : accumulator.length;
          accumulator.splice(index, 0, value);
          return accumulator;
        }, []);

      const newBalanceOfSelectedAsset = assets.find(({ value }) => value === assetName)?.balance;
      setBalanceOfAssetName(Number(newBalanceOfSelectedAsset || 0));
      return assets;
    }
    return defaultOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAssets, fromNetwork]);

  useEffect(() => {
    checkApprovedBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetName]);

  useEffect(() => {
    // NOTE: this effect should only run when wallet was changed
    const assestName = nativeCoin || defaultOptions[0].label;
    setAssetName(assestName);
    setBalanceOfAssetName(Number(accountInfo?.balance || 0));
    getFee(nativeCoin);
    // NOTE: remove accountInfo?.balance from dept to prevent reset assetName and balanceOfAssetName after complete a transfer transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId, nativeCoin]);

  useEffect(() => {
    if (!fromNetwork) setAssetName(defaultOptions[0].value);
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
    setApprovedBalance('');
  };

  const chainInfo = () => {
    return chainList.map(({ CHAIN_NAME, id, ...others }) => ({
      value: id,
      label: CHAIN_NAME,
      ...others,
    }));
  };

  const onChangeAsset = async asset => {
    setAssetName(asset.value);
    setBalanceOfAssetName(asset.balance);
    getFee(asset.value);
  };

  const handlePercentSelect = (percent: number) => {
    setPercent(percent);
  };

  const handleCloseTransferModal = async (isDismiss: boolean) => {
    if (shouldCheckIRC2Token && !isDismiss) {
      checkApprovedBalance();
      const balance = await getBalance(accountInfo?.address);
      setBalance(+balance);
    }
    setIsOpenConfirm(false);
  };

  const onRemoveFromContract = async () => {
    if (isRemovingFromContract) return;
    setIsRemovingFromContract(true);
    const res = await getBTPService()?.reclaim({
      coinName: assetName,
      value: appovedBalance || new BigNumber(balanceInputValue).plus(fee).toFixed(),
    });

    if (res?.transactionStatus === TransactionStatus.success) {
      setApprovedBalance('');
    }

    setIsRemovingFromContract(false);
  };

  const isInsufficient = new BigNumber(fee).plus(sendingBalance).isGreaterThan(balanceOfAssetName);
  const isEmpty = !sendingAddress || !accountInfo?.address;

  const maxTransferAmount = new BigNumber(balanceOfAssetName).minus(new BigNumber(fee));
  const isGreaterThanMaxTransferAmount = new BigNumber(sendingBalance).isGreaterThan(maxTransferAmount);

  const isApproved = !!appovedBalance;

  const balanceInputValue = isApproved ? new BigNumber(appovedBalance).minus(fee).toFixed() : sendingBalance;

  const handleDismiss = () => {
    toggleTransferAssetsModal();
  };
  return (
    <>
      <StyledModal
        isOpen={isOpenTransferAssetsModal}
        onDismiss={() => {
          !fromNetwork && handleDismiss();
        }}
        maxWidth={525}
      >
        <Wrapper>
          <Flex flexDirection={'column'} width={'100%'}>
            <Typography variant={'h2'}>
              <Trans>Transfer assets </Trans>
            </Typography>
            <Typography padding={'10px 0'}>
              <Trans> Move assets between ICON and other blockchains. </Trans>
              <StyledExternalLink href="https://docs.balanced.network/transfer-cross-chain#icon-bridge" target="_blank">
                <Trans>Learn more.</Trans>
              </StyledExternalLink>
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
                  balance={balanceInputValue}
                  onPercentSelect={(percent: number) => handlePercentSelect(percent)}
                  percent={percent}
                  fee={fee}
                  disabled={isApproved}
                />
                {isOpenAssetOptions && <AssetModal data={tokenList} onChange={onChangeAsset} />}
              </Box>

              <TransferAssetModal
                isOpen={isOpenConfirm}
                handleCloseTransferModal={handleCloseTransferModal}
                handleResetForm={resetForm}
                sendingAddress={sendingAddress}
                balance={balanceInputValue}
                tokenSymbol={assetName}
                fee={fee}
                hasAlreadyApproved={isApproved}
                shouldCheckIRC2Token={shouldCheckIRC2Token}
                onRemoveFromContract={onRemoveFromContract}
                isRemovingFromContract={isRemovingFromContract}
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
              <TextButton onClick={handleDismiss}>Cancel</TextButton>
              <Button
                disabled={
                  !balanceInputValue ||
                  isEmpty ||
                  !toCheckAddress(sendingAddress) ||
                  isInsufficient ||
                  isGreaterThanMaxTransferAmount ||
                  !fromNetwork ||
                  !toNetwork
                }
                onClick={handleTransfer}
              >
                {isInsufficient ? `Insufficient ${assetName}` : 'Transfer'}
              </Button>
            </Flex>
            {isApproved && (
              <>
                <Typography textAlign="center" paddingTop={'10px'} marginBottom={'5px'} color="#fb6a6a">
                  {appovedBalance} {assetName} is awaiting transfer.
                </Typography>
                {isRemovingFromContract ? (
                  <Typography textAlign="center">{`Removing ${assetName} from the bridge contract...`}</Typography>
                ) : (
                  <Typography textAlign="center">
                    <StyledTextButton onClick={onRemoveFromContract}>
                      Remove it from the bridge contract
                    </StyledTextButton>
                    , or enter an address to complete the transaction.
                  </Typography>
                )}
              </>
            )}
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
