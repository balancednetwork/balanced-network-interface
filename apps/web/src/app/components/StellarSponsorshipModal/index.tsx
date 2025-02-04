import React from 'react';

import { StellarXService, useXService } from '@balancednetwork/xwagmi';
import { BASE_FEE, Networks, Operation, TransactionBuilder } from '@balancednetwork/xwagmi';
import { Trans } from '@lingui/macro';
import axios from 'axios';
import { Flex } from 'rebass';

import { Typography } from '@/app/theme';
import { AnimatePresence, motion } from 'framer-motion';
import { TextButton } from '../Button';
import { StyledButton } from '../Button/StyledButton';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import ModalContent from '../ModalContent';
import Spinner from '../Spinner';

const SPONSOR_URL = 'https://ciihnqaqiomjdoicuy5rgwmy5m0vxanz.lambda-url.us-east-1.on.aws';
const SPONSORING_ADDRESS = 'GCV5PJ4H57MZFRH5GM3E3CNFLWQURNFNIHQOYGRQ7JHGWJLAR2SFVZO6';

type StellarSponsorshipModalProps = {
  address: string;
  text: string;
};

const StellarSponsorshipModal = ({ text, address }: StellarSponsorshipModalProps) => {
  const stellarXService = useXService('STELLAR') as unknown as StellarXService;
  const [isLoading, setLoading] = React.useState(false);
  const [isOpen, setOpen] = React.useState(false);
  const [initiated, setInitiated] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
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
      setInitiated(true);
      const response = await client.post('/', { data: signedTx });

      if (response.statusText === 'OK') {
        setSuccess(true);
        setTimeout(() => {
          handleDismiss();
        }, 2000);
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
            <Trans>Activate Stellar wallet?</Trans>
          </Typography>

          <Typography pt={3} color={'text1'} textAlign="center">
            <Trans>Sign a transaction to activate your wallet for free.</Trans>
          </Typography>

          <AnimatePresence>
            {initiated && (
              <motion.div
                style={{ transform: 'translateY(8px)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 40 }}
              >
                <Spinner $centered success={success} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!success && (
              <motion.div
                key={'sponsorship-ctas'}
                style={{ overflow: 'hidden' }}
                initial={{ opacity: 1, height: 'auto' }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Flex justifyContent="center" mt="20px" pt="20px" className="border-top">
                  <TextButton onClick={handleDismiss}>
                    {isLoading ? <Trans>Close</Trans> : <Trans>Cancel</Trans>}
                  </TextButton>
                  <StyledButton disabled={isLoading} $loading={isLoading} onClick={requestSponsorship}>
                    {isLoading ? <Trans>Activating</Trans> : <Trans>Activate wallet</Trans>}
                  </StyledButton>
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>
        </ModalContent>
      </Modal>
    </>
  );
};

export default StellarSponsorshipModal;
