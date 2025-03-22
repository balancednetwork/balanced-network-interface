import React from 'react';

import {
  STELLAR_TRUSTLINE_TOKEN_INFO,
  StellarXService,
  XToken,
  pollTransaction,
  useXService,
} from '@balancednetwork/xwagmi';
import { Asset, BASE_FEE, Networks, Operation, TransactionBuilder } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import { Flex } from 'rebass';

import { Typography } from '@/app/theme';
import { Currency } from '@balancednetwork/sdk-core';
import { AnimatePresence, motion } from 'framer-motion';
import { TextButton } from '../Button';
import { StyledButton } from '../Button/StyledButton';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import ModalContent from '../ModalContent';
import Spinner from '../Spinner';

type StellarTrustlineModalProps = {
  currency?: XToken;
  address: string;
  text: string;
};

const StellarTrustlineModal = ({ text, address, currency }: StellarTrustlineModalProps) => {
  const stellarXService = useXService('STELLAR') as unknown as StellarXService;
  const [isLoading, setLoading] = React.useState(false);
  const [isOpen, setOpen] = React.useState(false);
  const [initiated, setInitiated] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const handleDismiss = () => {
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen(!isOpen);
  };

  const requestTrustline = async () => {
    if (!stellarXService || !currency) {
      console.error('Stellar service not available');
      return;
    }
    try {
      const sourceAccount = await stellarXService.server.loadAccount(address);
      const asset = STELLAR_TRUSTLINE_TOKEN_INFO.find(t => t.contract_id === currency.address);

      if (!asset) {
        console.error(
          `Stellar Asset (${currency.symbol}, ${currency.address}) not found, can not proceed with trustline.`,
        );
        return;
      }

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(asset?.asset_code, asset?.asset_issuer),
          }),
        )
        .setTimeout(180)
        .build();

      setLoading(true);
      setInitiated(true);

      const { signedTxXdr: signedTx } = await stellarXService.walletsKit.signTransaction(transaction.toXDR());

      const response = await stellarXService.sorobanServer.sendTransaction(
        TransactionBuilder.fromXDR(signedTx, Networks.PUBLIC),
      );

      if (response.hash) {
        const txResult = await pollTransaction(response.hash, stellarXService);
        console.log('stellar txResult', txResult);
        if (txResult.status === 'SUCCESS') {
          setSuccess(true);
          setTimeout(() => {
            handleDismiss();
          }, 2000);
        } else {
          setSuccess(false);
          setError(`Transaction failed with status: ${txResult.status}`);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching Stellar sponsor transaction:', error);
      setError(`Transaction timed out.`);
      throw error;
    } finally {
      setLoading(false);
      setInitiated(false);
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
            {t`Activate Stellar ${currency?.symbol} account?`}
          </Typography>

          <Typography pt={3} color={'text1'} textAlign="center">
            {t`Sign a transaction to activate your ${currency?.symbol} account.`}
          </Typography>

          {error && (
            <Typography pt={3} color={'alert'} textAlign="center">
              {error}
            </Typography>
          )}

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
                  <StyledButton disabled={isLoading} $loading={isLoading} onClick={requestTrustline}>
                    {isLoading ? <Trans>Activating</Trans> : <Trans>Activate</Trans>}
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

export default StellarTrustlineModal;
