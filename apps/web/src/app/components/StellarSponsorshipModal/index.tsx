import { Typography } from '@/app/theme';
import { useXService } from '@/xwagmi/hooks';
import { StellarXService } from '@/xwagmi/xchains/stellar';
import { Trans } from '@lingui/macro';
import { BASE_FEE, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import axios from 'axios';
import React from 'react';
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

      // First request to get transaction data
      const response = await fetch(SPONSOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      console.log('STELLAR SPONSOR - Transaction data:', responseData);

      const transaction = TransactionBuilder.fromXDR(responseData, Networks.PUBLIC);
      const { signedTxXdr: signedTxXDR } = await stellarXService.walletsKit.signTransaction(transaction.toXDR());
      console.log('STELLAR SPONSOR - Signed tx XDR', signedTxXDR);

      // Second request to send signed transaction
      const sponsorResponse = await fetch(SPONSOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: signedTxXDR }),
      });

      if (!sponsorResponse.ok) {
        throw new Error('Network response was not ok');
      }

      const sponsorResult = await sponsorResponse.json();
      console.log('STELLAR SPONSOR - Sponsor result:', sponsorResult);
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
        <ModalContent>
          <Typography textAlign="center">Stellar Sponsorship</Typography>
          <Button onClick={requestSponsorship}>
            <Trans>Request sponsorship</Trans>
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StellarSponsorshipModal;
