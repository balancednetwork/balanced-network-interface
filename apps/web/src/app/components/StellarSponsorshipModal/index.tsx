import { Typography } from '@/app/theme';
import { useXService } from '@/xwagmi/hooks';
import { StellarXService } from '@/xwagmi/xchains/stellar';
import { Trans } from '@lingui/macro';
import { BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import axios from 'axios';
import React from 'react';
import { Box, Flex } from 'rebass';
import { useTheme } from 'styled-components';
import { Button, TextButton } from '../Button';
import { StyledButton } from '../Button/StyledButton';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import ModalContent from '../ModalContent';

const SPONSOR_URL = 'https://ciihnqaqiomjdoicuy5rgwmy5m0vxanz.lambda-url.us-east-1.on.aws';
const SPONSORING_ADDRESS = 'GCV5PJ4H57MZFRH5GM3E3CNFLWQURNFNIHQOYGRQ7JHGWJLAR2SFVZO6';

type StellarSponsorshipModalProps = {
  address: string;
  text: string;
};

const StellarSponsorshipModal = ({ text, address }: StellarSponsorshipModalProps) => {
  const stellarXService = useXService('STELLAR') as StellarXService;
  const [isLoading, setLoading] = React.useState(false);
  const [isOpen, setOpen] = React.useState(false);

  const handleDismiss = () => {
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen(!isOpen);
  };

  const requestSponsorship = async () => {
    if (!stellarXService) {
      console.error('Stellar service not available');
      return;
    }
    try {
      const client = axios.create({
        baseURL: SPONSOR_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      //Sponsoring account
      const sourceAccount = await stellarXService.server.loadAccount(SPONSORING_ADDRESS);

      //Create the transaction to sponsor the user account creation
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(
          Operation.beginSponsoringFutureReserves({
            source: SPONSORING_ADDRESS,
            sponsoredId: address,
          }),
        )
        .addOperation(
          Operation.createAccount({
            destination: address,
            startingBalance: '0',
          }),
        )
        .addOperation(
          Operation.endSponsoringFutureReserves({
            source: address,
          }),
        )
        .setTimeout(180)
        .build();

      const { signedTxXdr: signedTx } = await stellarXService.walletsKit.signTransaction(transaction.toXDR());

      setLoading(true);
      const response = await client.post('/', { data: signedTx });

      if (response.statusText === 'OK' && response.data) {
        console.log('sponsoring done');
        handleDismiss();
      }
    } catch (error) {
      console.error('Error fetching Stellar sponsor transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography color="primaryBright" onClick={handleToggle}>
        <UnderlineText>{text}</UnderlineText>
      </Typography>
      <Modal isOpen={isOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages>
          <Typography textAlign="center" color={'text'}>
            <Trans>Activate your Stellar account?</Trans>
          </Typography>

          <Typography pt={3} color={'text1'} textAlign="center">
            <Trans>Balanced activates your Stellar account for you with feeless transaction.</Trans>
          </Typography>

          <Flex justifyContent="center" mt="20px" pt="20px" className="border-top">
            <TextButton onClick={handleDismiss}>{isLoading ? <Trans>Close</Trans> : <Trans>Cancel</Trans>}</TextButton>

            <StyledButton disabled={isLoading} $loading={isLoading} onClick={requestSponsorship}>
              {isLoading ? <Trans>Activating</Trans> : <Trans>Activate</Trans>}
            </StyledButton>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StellarSponsorshipModal;
