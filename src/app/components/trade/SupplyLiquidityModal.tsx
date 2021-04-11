import React from 'react';

import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { usePoolPair, useSelectedPoolRate } from 'store/pool/hooks';
import { useTransactionAdder, TransactionStatus, useTransactionStatus } from 'store/transactions/hooks';
import { formatBigNumber } from 'utils';

import { depositMessage, supplyMessage } from './utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const MESSAGES = {
  [TransactionStatus.pending]: 'Sending',
  [TransactionStatus.success]: 'Success',
  [TransactionStatus.failure]: 'Failure',
};

enum SupplyModalStatus {
  'Supply' = 'Supply',
  'Cancel' = 'Cancel',
  'Remove' = 'Remove',
}

export default function SupplyLiquidityModal({ isOpen, onClose }: ModalProps) {
  const { account } = useIconReact();

  const selectedPair = usePoolPair();

  const selectedPairRatio = useSelectedPoolRate();

  const addTransaction = useTransactionAdder();

  const [inputATx, setInputATx] = React.useState('');

  const handleSupplyInputDepositConfirm = () => {
    if (!account) return;

    return bnJs
      .eject({ account: account })
      [selectedPair.baseCurrencyKey].dexDeposit(parsedAmounts[Field.CURRENCY_A])
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair).pendingMessage,
            summary: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair).successMessage,
          },
        );

        setInputATx(res.result);
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [inputBTx, setInputBTx] = React.useState('');

  const handleSupplyOutputDepositConfirm = () => {
    if (!account) return;
    return bnJs
      .eject({ account: account })
      [selectedPair.baseCurrencyKey].dexDeposit(parsedAmounts[Field.CURRENCY_B])
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair).pendingMessage,
            summary: depositMessage(selectedPair.quoteCurrencyKey, selectedPair.pair).successMessage,
          },
        );

        setInputBTx(res.result);
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [confirmTx, setConfirmTx] = React.useState('');

  const handleSupplyConfirm = () => {
    if (selectedPair.poolId === BalancedJs.utils.sICXICXpoolId) {
      bnJs
        .eject({ account: account })
        .Dex.transferICX(parsedAmounts[Field.CURRENCY_A])
        .then(res => {
          addTransaction(
            { hash: res.result },
            {
              pending: supplyMessage(
                formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
                selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
              ).pendingMessage,
              summary: supplyMessage(
                formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
                selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
              ).successMessage,
            },
          );

          setConfirmTx(res.result);
        })
        .catch(e => {
          console.error('error', e);
        });
    } else {
      bnJs
        .eject({ account: account })
        .Dex.add(
          parsedAmounts[Field.CURRENCY_A],
          parsedAmounts[Field.CURRENCY_B],
          selectedPairRatio,
          bnJs[selectedPair.baseCurrencyKey].address,
          bnJs[selectedPair.quoteCurrencyKey].address,
        )
        .then(res => {
          addTransaction(
            { hash: res.result },
            {
              pending: supplyMessage(
                formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
                selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
              ).pendingMessage,
              summary: supplyMessage(
                formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'currency'),
                selectedPair.baseCurrencyKey + ' / ' + selectedPair.quoteCurrencyKey,
              ).successMessage,
            },
          );

          setConfirmTx(res.result);
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  const confirmTxStatus = useTransactionStatus(confirmTx);
  React.useEffect(() => {
    if (confirmTx && confirmTxStatus === TransactionStatus.success) {
      onClose();
    }
  }, [confirmTx, confirmTxStatus, onClose]);

  // refresh Modal UI
  React.useEffect(() => {
    if (isOpen) {
      setInputATx('');
      setInputBTx('');
    }
  }, [isOpen]);

  const {
    // currencies,
    // pair,
    // pairState,
    // currencyBalances,
    parsedAmounts,
    // price,
    // liquidityMinted,
    // poolTokenPercentage,
    // error
  } = useDerivedMintInfo();

  const inputATxStatus: TransactionStatus = useTransactionStatus(inputATx);
  const inputBTxStatus: TransactionStatus = useTransactionStatus(inputBTx);

  const isSupplyEnabled =
    selectedPair.poolId === BalancedJs.utils.sICXICXpoolId ||
    (inputATx !== '' &&
      inputBTx !== '' &&
      inputATxStatus === TransactionStatus.success &&
      inputBTxStatus === TransactionStatus.success);

  const handleRemoveDeposit = () => {
    if (inputATx && inputATxStatus === TransactionStatus.success) {
      bnJs.Dex.withdraw(bnJs[selectedPair.baseCurrencyKey].address, parsedAmounts[Field.CURRENCY_A]).then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: `Withdrawing ${selectedPair.baseCurrencyKey}`,
            summary: `${parsedAmounts[Field.CURRENCY_A]}${selectedPair.baseCurrencyKey} added to your wallet`,
          },
        );
      });
    }

    if (inputBTx && inputBTxStatus === TransactionStatus.success) {
      bnJs.Dex.withdraw(bnJs[selectedPair.quoteCurrencyKey].address, parsedAmounts[Field.CURRENCY_B]).then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: `Withdrawing ${selectedPair.quoteCurrencyKey}`,
            summary: `${parsedAmounts[Field.CURRENCY_B]}${selectedPair.quoteCurrencyKey} added to your wallet`,
          },
        );
      });
    }

    onClose();
  };

  const [modalStatus, setModalStatus] = React.useState(SupplyModalStatus.Supply);

  const handleCancelSupply = () => {
    if (
      (inputATx && inputATxStatus === TransactionStatus.success) ||
      (inputBTx && inputBTxStatus === TransactionStatus.success)
    ) {
      setModalStatus(SupplyModalStatus.Cancel);
    } else {
      onClose();
    }
  };

  const handleGoBack = () => {
    setModalStatus(SupplyModalStatus.Supply);
  };

  const getModalContent = () => {
    if (modalStatus === SupplyModalStatus.Supply) {
      return (
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Supply liquidity?
          </Typography>

          <Typography
            variant="p"
            textAlign="center"
            mb={4}
            style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}
          >
            Send each asset to the pool, <br />
            then click Supply
          </Typography>

          <Flex alignItems="center" mb={4}>
            <Box width={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? 1 : 1 / 2}>
              <Typography
                variant="p"
                fontWeight="bold"
                textAlign={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? 'center' : 'right'}
              >
                {formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'ratio')} {selectedPair.baseCurrencyKey}
              </Typography>
            </Box>
            <Box width={1 / 2} style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}>
              <SupplyButton disabled={!!inputATx} ml={3} onClick={handleSupplyInputDepositConfirm}>
                {inputATx ? MESSAGES[inputATxStatus] : 'Send'}
              </SupplyButton>
            </Box>
          </Flex>

          <Flex
            alignItems="center"
            mb={4}
            style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}
          >
            <Box width={1 / 2}>
              <Typography variant="p" fontWeight="bold" textAlign="right">
                {formatBigNumber(parsedAmounts[Field.CURRENCY_B], 'ratio')} {selectedPair.quoteCurrencyKey}
              </Typography>
            </Box>
            <Box width={1 / 2}>
              <SupplyButton disabled={!!inputBTx} ml={3} onClick={handleSupplyOutputDepositConfirm}>
                {inputBTx ? MESSAGES[inputBTxStatus] : 'Send'}
              </SupplyButton>
            </Box>
          </Flex>

          <Typography textAlign="center">
            {selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? (
              <>Your ICX will be locked in the pool for the first 24 hours.</>
            ) : (
              <>
                Your ICX will be staked, and your
                <br /> assets will be locked for 24 hours.
              </>
            )}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleCancelSupply}>Cancel</TextButton>
            <Button disabled={!isSupplyEnabled} onClick={handleSupplyConfirm}>
              Supply
            </Button>
          </Flex>
        </Flex>
      );
    }

    if (modalStatus === SupplyModalStatus.Cancel) {
      return (
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Cancel supply?
          </Typography>

          <Typography
            variant="p"
            textAlign="center"
            mb={4}
            style={selectedPair.baseCurrencyKey.toLowerCase() === 'icx' ? { display: 'none' } : {}}
          >
            Remove your assets from the <br />
            pool to cancel this transaction
          </Typography>

          {inputATx && inputATxStatus === TransactionStatus.success && (
            <Flex alignItems="center" justifyContent="center" mb={4}>
              <Typography variant="p" fontWeight="bold">
                {formatBigNumber(parsedAmounts[Field.CURRENCY_A], 'ratio')} {selectedPair.baseCurrencyKey}
              </Typography>
            </Flex>
          )}

          {inputBTx && inputBTxStatus === TransactionStatus.success && (
            <Flex alignItems="center" justifyContent="center" mb={4}>
              <Typography variant="p" fontWeight="bold" textAlign="right">
                {formatBigNumber(parsedAmounts[Field.CURRENCY_B], 'ratio')} {selectedPair.quoteCurrencyKey}
              </Typography>
            </Flex>
          )}

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleGoBack}>Go back</TextButton>
            <RedButton onClick={handleRemoveDeposit}>Remove and cancel</RedButton>
          </Flex>
        </Flex>
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onDismiss={() => undefined}>
      {getModalContent()}
    </Modal>
  );
}

const SupplyButton = styled(Button)`
  padding: 5px 10px;
  font-size: 12px;
`;

const RedButton = styled(Button)`
  background-color: red;

  &:hover {
    background-color: red;
  }

  &:disabled {
    background: #27264a;
  }
`;
