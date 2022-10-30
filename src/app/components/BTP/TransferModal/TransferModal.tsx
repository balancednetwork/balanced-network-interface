import React, { useEffect } from 'react';

import { Trans } from '@lingui/macro';
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

export const TransferAssetModal = ({ isOpen, setIsOpen, sendingAddress, balance, tokenSymbol, fee }) => {
  const networkSrc = useFromNetwork();
  const networkDst = useToNetwork();
  const [isApproved, setIsApproved] = React.useState<boolean>(false);

  const symbol = window['accountInfo'].symbol;
  const isSendingNativeCoin = symbol === tokenSymbol;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  const createTransactionInfo = () => {
    const tx = {
      to: toChecksumAddress(sendingAddress),
      value: balance,
      coinName: tokenSymbol,
      network: networkDst.value,
    };
    window[transactionInfo] = {
      networkDst: networkDst.value,
      networkSrc: networkSrc.value,
      to: tx.to,
      value: tx.value,
      coinName: tx.coinName,
      nid: IconConverter.toNumber(networkSrc.NETWORK_ADDRESS.split('.')[0]),
    };
    return tx;
  };

  const approve = async () => {
    const tx = createTransactionInfo();
    await getService()?.approve(tx, tokenSymbol);

    if (window['transactionInfo']?.txHash) {
      setIsApproved(true);
    }
  };

  const transfer = async () => {
    const tx = createTransactionInfo();
    getService()?.transfer(tx, tokenSymbol, isApproved);
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    isOpen && setIsApproved(false);
  }, [isOpen]);

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
              <Button onClick={approve} fontSize={14}>
                <Trans>Approve asset</Trans>
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
          <Typography variant="p" textAlign="center">
            <Trans>{sendingAddress}</Trans>
          </Typography>
        </Typography>

        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          <>
            <TextButton onClick={toggleOpen} fontSize={14}>
              <Trans> Cancel </Trans>
            </TextButton>
            <Button onClick={transfer} fontSize={14}>
              <Trans>Transfer</Trans>
            </Button>
          </>
        </Flex>
      </StyledModalContent>
    </Modal>
  );
};
