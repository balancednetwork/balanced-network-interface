import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
// import { transactionInfo } from 'btp/src/connectors/constants';
import { transactionInfo } from 'btp/src/connectors/constants';
import { toChecksumAddress } from 'btp/src/connectors/MetaMask/utils';
import { useGetBTPService } from 'btp/src/hooks/useService';
import { useFromNetwork, useToNetwork } from 'btp/src/store/bridge/hooks';
import { Converter as IconConverter } from 'icon-sdk-js';
import { Trans } from 'react-i18next';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as CheckIcon } from 'assets/icons/tick.svg';
import { MODAL_FADE_DURATION } from 'constants/index';
import { TransactionStatus } from 'store/transactions/hooks';

const CheckIconWrapper = styled.div`
  display: block;
  width: 32px;
`;
const StyledModalContent = styled(Flex)`
  width: 100%;
  align-items: stretch;
  flex-direction: column;
  margin: 25px;
  text-align: center;
`;
const StyledTextButton = styled(TextButton)`
  color: #2fccdc;
  padding: 0 !important;
  &:hover {
    text-decoration: underline !important;
  }
`;

export const TransferAssetModal = ({
  isOpen,
  handleCloseTransferModal,
  handleResetForm,
  sendingAddress,
  balance,
  tokenSymbol,
  fee,
  hasAlreadyApproved,
  shouldCheckIRC2Token,
  onRemoveFromContract,
  isRemovingFromContract,
}) => {
  const networkSrc = useFromNetwork();
  const networkDst = useToNetwork();
  const [approveStatus, setApproveStatus] = useState<TransactionStatus | ''>();
  const [transferStatus, setTransferStatus] = useState<TransactionStatus | ''>('');

  const isApproved = hasAlreadyApproved || approveStatus === TransactionStatus.success;
  const isApproving = approveStatus === TransactionStatus.pending;
  const isTranferring = transferStatus === TransactionStatus.pending;

  const symbol = window['accountInfo']?.symbol;
  const isSendingNativeCoin = symbol === tokenSymbol;
  const getBTPService = useGetBTPService();

  const onClose = () => {
    handleCloseTransferModal(approveStatus !== TransactionStatus.success);
  };
  const onDismiss = () => {
    if (!isApproved && !isApproving && !isTranferring) {
      onClose();
    }
  };

  const createTransactionParams = () => {
    const tx = {
      to: toChecksumAddress(sendingAddress),
      value: new BigNumber(balance).plus(fee).toFixed(),
      coinName: tokenSymbol,
      network: networkDst.value,
    };
    window[transactionInfo] = {
      networkDst: networkDst.label,
      networkSrc: networkSrc.label,
      to: tx.to,
      value: balance,
      coinName: tx.coinName,
      nid: IconConverter.toNumber(networkSrc.NETWORK_ADDRESS.split('.')[0]),
    };
    return tx;
  };

  const transferNativeToken = async () => {
    const tx = createTransactionParams();
    return getBTPService()?.transfer(tx, isSendingNativeCoin, tokenSymbol);
  };

  const approveNonNativeToken = async () => {
    setApproveStatus(TransactionStatus.pending);
    const res = await transferNativeToken();
    setApproveStatus(res?.transactionStatus || '');
    if (res?.transactionStatus === TransactionStatus.failure) {
      onClose();
      return;
    }
  };

  const transfer = async () => {
    setTransferStatus(TransactionStatus.pending);
    let res;
    if (isSendingNativeCoin) {
      res = await transferNativeToken();
    } else {
      const tx = hasAlreadyApproved ? createTransactionParams() : undefined;
      res = await getBTPService()?.sendNonNativeCoin(tx);
    }
    setTransferStatus(res?.transactionStatus || '');
    if (res?.transactionStatus === TransactionStatus.failure) {
      onClose();
      return;
    }
    if (res?.transactionStatus === TransactionStatus.success) {
      handleCloseTransferModal();
      setTimeout(() => {
        handleResetForm();
      }, MODAL_FADE_DURATION);
    }
  };
  const removeFromContract = async () => {
    await onRemoveFromContract();
    setApproveStatus('');
  };
  useEffect(() => {
    if (isOpen) {
      setApproveStatus('');
      setTransferStatus('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <StyledModalContent>
        <Typography textAlign="center" mb={1}>
          <Trans>Transfer asset?</Trans>
        </Typography>

        <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
          {balance} {tokenSymbol}
        </Typography>
        <Typography textAlign="center" mb={1}>
          <Trans>
            + {fee} {tokenSymbol} transfer fee
          </Trans>
        </Typography>

        {!isSendingNativeCoin && !hasAlreadyApproved && (
          <Flex justifyContent="center" mt={2}>
            {!isApproved ? (
              <Button fontSize={14} onClick={approveNonNativeToken} disabled={isApproving}>
                {shouldCheckIRC2Token ? (
                  <Trans>{isApproving ? 'Sending to contract' : 'Send to contract'}</Trans>
                ) : (
                  <Trans>{isApproving ? 'Approving asset' : 'Approve asset'}</Trans>
                )}
              </Button>
            ) : networkSrc.value === 'BSC' ? (
              <CheckIconWrapper>
                <CheckIcon />
              </CheckIconWrapper>
            ) : (
              <Typography textAlign="center">
                {isRemovingFromContract ? (
                  <StyledTextButton padding="0 !important" color="#2fccdc !important">
                    Removing from contract
                  </StyledTextButton>
                ) : (
                  <StyledTextButton onClick={removeFromContract} padding="0 !important" color="#2fccdc !important">
                    Remove from contract
                  </StyledTextButton>
                )}
              </Typography>
            )}
          </Flex>
        )}

        <Flex my={5}>
          <Box width={1 / 2} className="border-right">
            <Typography textAlign="center">
              <Trans>From</Trans>
            </Typography>
            <Typography variant="p" textAlign="center">
              {networkSrc?.label}
            </Typography>
          </Box>

          <Box width={1 / 2}>
            <Typography textAlign="center">
              <Trans>To</Trans>
            </Typography>
            <Typography variant="p" textAlign="center">
              {networkDst?.label}
            </Typography>
          </Box>
        </Flex>

        <Trans>Address</Trans>
        <Typography variant="p" textAlign="center" color="white" width="55%" margin="0 auto">
          {sendingAddress}
        </Typography>

        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          <>
            <TextButton onClick={onClose} fontSize={14}>
              <Trans> Cancel </Trans>
            </TextButton>
            <Button onClick={transfer} fontSize={14} disabled={(!isSendingNativeCoin && !isApproved) || isTranferring}>
              <Trans>{isTranferring ? 'Transferring' : 'Transfer'}</Trans>
            </Button>
          </>
        </Flex>
      </StyledModalContent>
    </Modal>
  );
};
