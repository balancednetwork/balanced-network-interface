import React from 'react';

import {
  STELLAR_TRUSTLINE_TOKEN_INFO,
  StellarXService,
  XToken,
  pollTransaction,
  useXLMBalance,
  useXService,
} from '@balancednetwork/xwagmi';
import { Asset, BASE_FEE, Networks, Operation, TransactionBuilder } from '@balancednetwork/xwagmi';
import { Trans, t } from '@lingui/macro';
import { Flex } from 'rebass';

import { Typography } from '@/app/theme';
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

const INSUFFICIENT_XLM_BALANCE = `You need at least 1.5 XLM in the Stellar wallet.`;

const StellarTrustlineModal = ({ text, address, currency }: StellarTrustlineModalProps) => {
  const stellarXService = useXService('STELLAR') as unknown as StellarXService;
  const [isLoading, setLoading] = React.useState(false);
  const [isOpen, setOpen] = React.useState(false);
  const [initiated, setInitiated] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { data: xlmBalance } = useXLMBalance(address);
  const [isEnoughXLM, setIsEnoughXLM] = React.useState(false);

  React.useEffect(() => {
    if (xlmBalance && xlmBalance >= 1.5) {
      setIsEnoughXLM(true);
      if (error && error === INSUFFICIENT_XLM_BALANCE) {
        setError(null);
      }
    } else {
      setIsEnoughXLM(false);
      setError(INSUFFICIENT_XLM_BALANCE);
    }
  }, [xlmBalance, error]);

  const resetState = React.useCallback(() => {
    setLoading(false);
    setInitiated(false);
    setSuccess(false);
  }, []);

  const handleDismiss = React.useCallback(() => {
    setOpen(false);
    resetState();
  }, [resetState]);

  const handleToggle = React.useCallback(() => {
    setOpen(!isOpen);
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const requestTrustline = async () => {
    if (!stellarXService || !currency) {
      setError(t`Stellar service not available`);
      return;
    }

    try {
      const sourceAccount = await stellarXService.server.loadAccount(address);
      const asset = STELLAR_TRUSTLINE_TOKEN_INFO.find(t => t.contract_id === currency.address);

      if (!asset) {
        setError(t`Asset ${currency.symbol} not found. Cannot proceed with trustline.`);
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

      const { signedTxXdr: signedTx } = await stellarXService.walletsKit.signTransaction(transaction.toXDR());

      if (signedTx) {
        setLoading(true);
        setInitiated(true);
        setError(null);
      }

      const response = await stellarXService.sorobanServer.sendTransaction(
        TransactionBuilder.fromXDR(signedTx, Networks.PUBLIC),
      );

      if (!response.hash) {
        throw new Error('Transaction hash not received');
      }

      const txResult = await pollTransaction(response.hash, stellarXService);

      if (txResult.status === 'SUCCESS') {
        setSuccess(true);
        setTimeout(() => {
          handleDismiss();
        }, 2000);
      } else {
        setError(t`Transaction failed with status: ${txResult.status}`);
      }
    } catch (error) {
      console.error('Error in Stellar trustline transaction:', error);
      setError(
        error instanceof Error
          ? !error.message.includes('Cannot read properties')
            ? error.message
            : null
          : t`Transaction failed. Please try again.`,
      );
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
            {t`Activate Stellar ${currency?.symbol}?`}
          </Typography>

          <Typography pt={3} color={'text1'} textAlign="center">
            {t`Sign a transaction to activate ${currency?.symbol} for your Stellar wallet.`}
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
                  <StyledButton disabled={isLoading || !isEnoughXLM} $loading={isLoading} onClick={requestTrustline}>
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
