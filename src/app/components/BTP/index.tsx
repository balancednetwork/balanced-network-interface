import React, { useState } from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal, { ModalProps } from 'app/components/Modal';
import { Typography } from 'app/theme';
import { useModalOpen, useTransferAssetsModalToggle, useBridgeWalletModalToggle } from 'store/application/hooks';
import { ApplicationModal } from 'store/application/reducer';

import { getService } from '../../../store/bridge/services/transfer';
import { getBalanceToken } from '../../../store/bridge/utils/constants';
import Address from './Address';
import AssetToTransfer from './AssetToTransfer';
import NetworkSelector from './NetworkSelector';
// import Transfer from './transfer';

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 35px;
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
        max-width: 430px;
      }
    `}
  }
`;

const BTP = () => {
  const [isOpenConfirm, setIsOpenConfirm] = useState(false);
  const walletModalOpen = useModalOpen(ApplicationModal.TRANSFER_ASSETS);
  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const toggleWalletModal = useBridgeWalletModalToggle();
  const [accountInfo, setAccountInfo] = useState(JSON.parse(String(localStorage.getItem('account_info'))));
  console.log(accountInfo);

  const [networkFrom, setNetworkFrom] = useState(['Ethereum', 'Moonbeam', 'Binance']);
  const [networkTo, setNetworkTo] = useState(['Ethereum', 'Moonbeam', 'Binance']);
  const tokens = [
    { label: accountInfo.unit, value: accountInfo.unit },
    ...getBalanceToken()!
      .map(symbol => ({ label: symbol, value: symbol }))
      .filter(item => item.label !== accountInfo.unit),
  ];
  console.log(tokens);

  const assetTransfer = [];
  const onChangeRefundSelect = async => {
    //  tokens.forEach((token)  => {

    // })
    var a: any = getService()?.getBalanceOf({
      address: accountInfo.address,
      refundable: true,
      symbol: accountInfo.unit,
    });
    a.then(refund => {
      console.log(refund);
    });
  };

  const handleTransfer = () => {
    toggleWalletModal();
    setIsOpenConfirm(true);
  };

  return (
    <>
      <StyledModal isOpen={walletModalOpen} onDismiss={toggleTransferAssetsModal} maxWidth={430}>
        <Wrapper>
          <Flex flexDirection={'column'} width={'100%'}>
            <Typography variant={'h2'}>Transfer assets</Typography>
            <Typography padding={'10px 0'}>Move assets between ICON and other blockchains</Typography>

            <Grid>
              <Box>
                <NetworkSelector label={'From'} data={networkFrom} />
              </Box>
              <Box>
                <NetworkSelector label={'To'} data={networkTo} />
              </Box>
              <Box className="full-width">
                <AssetToTransfer />
              </Box>
              <Box className="full-width">
                <Address />
              </Box>
            </Grid>

            <Divider margin={'20px 0'} />
            <Flex justifyContent={'center'}>
              <TextButton onClick={toggleTransferAssetsModal}>Cancel</TextButton>
              <Button onClick={handleTransfer}>Transfer</Button>
            </Flex>
          </Flex>
          {/* {isOpenConfirm && <Transfer handleClose={handleClose} />} */}
        </Wrapper>
      </StyledModal>
    </>
  );
};

export default BTP;
