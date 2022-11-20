import React, { useEffect } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { transactionInfo } from 'btp/src/connectors/constants';
import { toChecksumAddress } from 'btp/src/connectors/MetaMask/utils';
import { getService } from 'btp/src/services/transfer';
import { Converter as IconConverter } from 'icon-sdk-js';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as CheckIcon } from 'assets/icons/tick.svg';
import { useFromNetwork, useToNetwork } from 'store/bridge/hooks';
import { TransactionStatus } from 'store/transactions/hooks';
import { EVENTS, on, off } from 'utils/customEvent';

const StyledModalContent = styled(Flex)`
  width: 100%;
  align-items: stretch;
  flex-direction: column;
  margin: 25px;
`;

const CheckIconWrapper = styled.div`
  display: block;
  width: 32px;
`;

export const TransferAssetModal = ({
  isOpen,
  setIsOpen,
  handleResetForm,
  sendingAddress,
  balance,
  tokenSymbol,
  fee,
}) => {
  const networkSrc = useFromNetwork();
  const networkDst = useToNetwork();
  const [approveStatus, setApproveStatus] = React.useState<TransactionStatus | ''>('');
  const [transferStatus, setTransferStatus] = React.useState<TransactionStatus | ''>('');
  const isApproved = approveStatus === TransactionStatus.success;
  const isApproving = approveStatus === TransactionStatus.pending;
  const isTranferring = transferStatus === TransactionStatus.pending;

  const symbol = window['accountInfo']?.symbol;
  const isSendingNativeCoin = symbol === tokenSymbol;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const transferNativeToken = async () => {
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
      value: tx.value,
      coinName: tx.coinName,
      nid: IconConverter.toNumber(networkSrc.NETWORK_ADDRESS.split('.')[0]),
    };
    getService()?.transfer(tx, isSendingNativeCoin, tokenSymbol);
  };
  const approveNonNativeToken = () => {
    setApproveStatus(TransactionStatus.pending);
    transferNativeToken();
  };

  const transfer = () => {
    setTransferStatus(TransactionStatus.pending);
    if (isSendingNativeCoin) {
      transferNativeToken();
      return;
    }
    getService()?.sendNonNativeCoin();
  };

  useEffect(() => {
    const approveSucces = ({ detail }) => {
      setApproveStatus(detail.status);
      if (detail.status === TransactionStatus.failure) {
        setIsOpen(!isOpen);
      }
    };
    const transferSuccess = ({ detail }) => {
      setTransferStatus(detail.status);
      if (detail.status === TransactionStatus.success) {
        handleResetForm();
        setIsOpen(!isOpen);
      }
      if (detail.status === TransactionStatus.failure) {
        setIsOpen(!isOpen);
      }
    };
    if (isOpen) {
      setApproveStatus('');
      setTransferStatus('');
      on(EVENTS.APPROVE, approveSucces);
      on(EVENTS.TRANSFER, transferSuccess);
    }

    return () => {
      if (isOpen) {
        off(EVENTS.APPROVE, approveSucces);
        off(EVENTS.TRANSFER, transferSuccess);
      }
    };
  }, [handleResetForm, isOpen, setIsOpen]);

  return (
    <Modal isOpen={isOpen} onDismiss={toggleOpen}>
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
        {!isSendingNativeCoin && (
          <Flex justifyContent="center" mt={2}>
            {!isApproved ? (
              <Button fontSize={14} onClick={approveNonNativeToken} disabled={isApproving}>
                <Trans>{isApproving ? 'Approving asset' : 'Approve asset'}</Trans>
              </Button>
            ) : (
              <CheckIconWrapper>
                <CheckIcon />
              </CheckIconWrapper>
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

        <Typography textAlign="center" width={'55%'} margin={'0 auto'}>
          <Trans>Address</Trans>
          <Typography variant="p" textAlign="center" color="white">
            {sendingAddress}
          </Typography>
        </Typography>

        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          <>
            <TextButton onClick={toggleOpen} fontSize={14}>
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
