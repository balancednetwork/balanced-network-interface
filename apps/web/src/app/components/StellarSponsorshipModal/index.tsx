import { Typography } from '@/app/theme';
import { useXService } from '@/xwagmi/hooks';
import { StellarXService } from '@/xwagmi/xchains/stellar';
import { Trans } from '@lingui/macro';
import { BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import axios from 'axios';
import React from 'react';
import { Box, Flex } from 'rebass';
import { useTheme } from 'styled-components';
import { Button } from '../Button';
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
      setLoading(true);

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
      const response = await client.post('/', { data: signedTx });

      if (response.statusText === 'OK' && response.data) {
        console.log('sponsoring done');
      }
    } catch (error) {
      console.error('Error fetching Stellar sponsor transaction:', error);
      throw error;
    } finally {
      setLoading(false);
      handleDismiss();
    }
  };

  return (
    <>
      <Typography color="primaryBright" onClick={handleToggle}>
        <UnderlineText>{text}</UnderlineText>
      </Typography>
      <Modal isOpen={isOpen} onDismiss={handleDismiss}>
        <ModalContent noMessages>
          <Typography textAlign="center">Stellar Sponsorship</Typography>
          <Flex pt={'20px'} justifyContent="center">
            <Button onClick={requestSponsorship}>
              <Trans>Request sponsorship</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StellarSponsorshipModal;
