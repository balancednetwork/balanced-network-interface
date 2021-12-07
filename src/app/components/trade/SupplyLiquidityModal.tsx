import React from 'react';

import { isEmpty } from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import TickSrc from 'assets/icons/tick.svg';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { useTransactionAdder, TransactionStatus, useTransactionStatus } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { CurrencyAmount, Currency, Token } from 'types/balanced-sdk-core';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import { depositMessage, supplyMessage } from './utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  currencies: { [field in Field]?: Currency };
}

const getPairName = (currencies: { [field in Field]?: Currency }) => {
  return `${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}`;
};

export default function SupplyLiquidityModal({ isOpen, onClose, parsedAmounts, currencies }: ModalProps) {
  const { account } = useIconReact();

  const { currencyDeposits, pair } = useDerivedMintInfo();
  const { [Field.CURRENCY_A]: baseDeposit, [Field.CURRENCY_B]: quoteDeposit } = currencyDeposits;
  const addTransaction = useTransactionAdder();

  const shouldLedgerSign = useShouldLedgerSign();

  const [shouldSendAssetsA, updateShouldSendAssetsA] = React.useState(false);
  const [shouldSendAssetsB, updateShouldSendAssetsB] = React.useState(false);

  const [shouldRemoveAssetsA, updateShouldRemoveAssetsA] = React.useState(false);
  const [shouldRemoveAssetsB, updateShouldRemoveAssetsB] = React.useState(false);

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const [addingTxs, setAddingTxs] = React.useState({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });

  const handleAdd = (field: Field) => async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const token = currencies[field] as Token;

    try {
      if (bnJs.contractSettings.ledgerSettings.actived) {
        if (field === Field.CURRENCY_A) {
          updateShouldSendAssetsA(true);
        } else if (field === Field.CURRENCY_B) {
          updateShouldSendAssetsB(true);
        }
      }

      const res: any = await bnJs
        .inject({ account })
        .getContract(token.address)
        .deposit(BalancedJs.utils.toLoop(parsedAmounts[field]!.toFixed(), token.symbol));

      addTransaction(
        { hash: res.result },
        {
          pending: depositMessage(token.symbol!, getPairName(currencies)).pendingMessage,
          summary: depositMessage(token.symbol!, getPairName(currencies)).successMessage,
        },
      );

      setAddingTxs(state => ({ ...state, [field]: res.result }));
    } catch (error) {
      console.error('error', error);
      setAddingTxs({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
    } finally {
      if (field === Field.CURRENCY_A) {
        updateShouldSendAssetsA(false);
      } else if (field === Field.CURRENCY_B) {
        updateShouldSendAssetsB(false);
      }

      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
    }
  };

  const [removingTxs, setRemovingTxs] = React.useState({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });

  const handleRemove = (field: Field, amountWithdraw?: CurrencyAmount<Currency>) => async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const token = currencies[field] as Token;

    try {
      if (bnJs.contractSettings.ledgerSettings.actived) {
        if (field === Field.CURRENCY_A) {
          updateShouldRemoveAssetsA(true);
        } else if (field === Field.CURRENCY_B) {
          updateShouldRemoveAssetsB(true);
        }
      }

      const res: any = await bnJs
        .inject({ account })
        .Dex.withdraw(token.address, BalancedJs.utils.toLoop(amountWithdraw!.toFixed(), token.symbol));
      addTransaction(
        { hash: res.result },
        {
          pending: `Withdrawing ${token.symbol}`,
          summary: `${amountWithdraw?.toSignificant(6)} ${token.symbol} added to your wallet`,
        },
      );

      setRemovingTxs(state => ({ ...state, [field]: res.result }));
    } catch (error) {
      console.error('error', error);
      //setAddingTxs({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
    } finally {
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      if (field === Field.CURRENCY_A) {
        updateShouldRemoveAssetsA(false);
      } else if (field === Field.CURRENCY_B) {
        updateShouldRemoveAssetsB(false);
      }
    }
  };

  const [confirmTx, setConfirmTx] = React.useState('');

  const handleSupplyConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (isQueue) {
      const t = parsedAmounts[Field.CURRENCY_B];

      bnJs
        .inject({ account })
        .Dex.transferICX(BalancedJs.utils.toLoop(t!.toFixed()))
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: supplyMessage(getPairName(currencies)).pendingMessage,
              summary: supplyMessage(getPairName(currencies)).successMessage,
            },
          );
          if (confirmTxStatus === TransactionStatus.failure) {
            setConfirmTx('');
          } else {
            setConfirmTx(res.result);
          }
        })
        .catch(e => {
          console.error('errors', e);
        })
        .finally(() => {
          changeShouldLedgerSign(false);
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    } else {
      const baseToken = currencies[Field.CURRENCY_A] as Token;
      const quoteToken = currencies[Field.CURRENCY_B] as Token;
      bnJs
        .inject({ account })
        .Dex.add(
          baseToken.address,
          quoteToken.address,
          baseDeposit?.quotient?.toString() ?? '0',
          quoteDeposit?.toFixed() ?? '0',
        )
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: supplyMessage(getPairName(currencies)).pendingMessage,
              summary: supplyMessage(getPairName(currencies)).successMessage,
            },
          );

          setConfirmTx(res.result);
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
          changeShouldLedgerSign(false);
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
    if (!isOpen) {
      setAddingTxs({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
      setRemovingTxs({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
      setConfirmTx('');
      setHasErrorMessage(false);
    }
  }, [isOpen, pair]);

  const addingATxStatus: TransactionStatus = useTransactionStatus(addingTxs[Field.CURRENCY_A]);
  const addingBTxStatus: TransactionStatus = useTransactionStatus(addingTxs[Field.CURRENCY_B]);

  const removingATxStatus: TransactionStatus = useTransactionStatus(removingTxs[Field.CURRENCY_A]);
  const removingBTxStatus: TransactionStatus = useTransactionStatus(removingTxs[Field.CURRENCY_B]);

  React.useEffect(() => {
    if (addingATxStatus === TransactionStatus.success) {
      setRemovingTxs(state => ({ ...state, [Field.CURRENCY_A]: '' }));
    }
  }, [addingATxStatus]);

  React.useEffect(() => {
    if (removingATxStatus === TransactionStatus.success) {
      setAddingTxs(state => ({ ...state, [Field.CURRENCY_A]: '' }));
    }
  }, [removingATxStatus]);

  React.useEffect(() => {
    if (addingBTxStatus === TransactionStatus.success) {
      setRemovingTxs(state => ({ ...state, [Field.CURRENCY_B]: '' }));
    }
  }, [addingBTxStatus]);

  React.useEffect(() => {
    if (removingBTxStatus === TransactionStatus.success) {
      setAddingTxs(state => ({ ...state, [Field.CURRENCY_B]: '' }));
    }
  }, [removingBTxStatus]);

  const [hasErrorMessage, setHasErrorMessage] = React.useState(false);
  const handleCancelSupply = () => {
    if (addingATxStatus === TransactionStatus.success || addingBTxStatus === TransactionStatus.success) {
      setHasErrorMessage(true);
    } else {
      onClose();
    }
    changeShouldLedgerSign(false);
  };

  const isQueue = !!pair?.queueRate;

  const isBALNRewardPool = true;
  const isEnabled = isQueue
    ? true
    : (addingATxStatus === TransactionStatus.success && addingBTxStatus === TransactionStatus.success) ||
      (baseDeposit?.greaterThan(0) && quoteDeposit?.greaterThan(0));

  const isInitialValueA = addingTxs[Field.CURRENCY_A] === '' && removingTxs[Field.CURRENCY_A] === '';
  const isInitialWithdrawA =
    addingTxs[Field.CURRENCY_A] === '' && removingTxs[Field.CURRENCY_A] !== '' && baseDeposit?.greaterThan(0);
  const isPendingA = addingATxStatus === TransactionStatus.pending && removingTxs[Field.CURRENCY_A] === '';
  const isFailureA = addingATxStatus === TransactionStatus.failure && removingTxs[Field.CURRENCY_A] === '';
  const isRemoveSuccessA = removingATxStatus === TransactionStatus.success;
  const shouldShowSendBtnA = isInitialValueA || isPendingA || isFailureA || isRemoveSuccessA || isInitialWithdrawA;
  const shouldShowSendA = isEmpty(addingTxs[Field.CURRENCY_A]) || isFailureA;
  const shouldShowRemoveA = isEmpty(removingTxs[Field.CURRENCY_A]);

  const isInitialValueB = addingTxs[Field.CURRENCY_B] === '' && removingTxs[Field.CURRENCY_B] === '';
  const isInitialWithdrawB =
    addingTxs[Field.CURRENCY_B] === '' && removingTxs[Field.CURRENCY_B] !== '' && quoteDeposit?.greaterThan(0);
  const isPendingB = addingBTxStatus === TransactionStatus.pending && removingTxs[Field.CURRENCY_B] === '';
  const isFailureB = addingBTxStatus === TransactionStatus.failure && removingTxs[Field.CURRENCY_B] === '';
  const isRemoveSuccessB = removingBTxStatus === TransactionStatus.success;
  const shouldShowSendBtnB = isInitialValueB || isPendingB || isFailureB || isRemoveSuccessB || isInitialWithdrawB;
  const shouldShowSendB = isEmpty(addingTxs[Field.CURRENCY_B]) || isFailureB;
  const shouldShowRemoveB = isEmpty(removingTxs[Field.CURRENCY_B]);

  const hasEnoughICX = useHasEnoughICX();

  return (
    <Modal isOpen={isOpen} onDismiss={() => undefined}>
      <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
        <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
          Supply liquidity?
        </Typography>
        <Typography variant="p" textAlign="center" mb={4} hidden={isQueue}>
          Send each asset to the contract, <br />
          then click Supply
        </Typography>
        <Flex alignItems="center" mb={1} hidden={isQueue}>
          <Box
            width={1 / 2}
            sx={{
              borderBottom: ['0px solid rgba(255, 255, 255, 0.15)', 0],
              borderRight: [0, '1px solid rgba(255, 255, 255, 0.15)'],
            }}
          >
            <StyledDL>
              <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                Assets to send
              </Typography>

              {shouldShowSendBtnA ? (
                <>
                  <Typography variant="p" fontWeight="bold" textAlign="center">
                    {parsedAmounts[Field.CURRENCY_A]?.toSignificant(4)} {currencies[Field.CURRENCY_A]?.symbol}
                  </Typography>
                  {shouldSendAssetsA && (
                    <>
                      <Spinner></Spinner>
                      <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                        Confirm the transaction on your Ledger.
                      </Typography>
                    </>
                  )}
                  {!shouldSendAssetsA && (
                    <>
                      <SupplyButton
                        disabled={!shouldShowSendA || shouldSendAssetsB}
                        mt={2}
                        onClick={handleAdd(Field.CURRENCY_A)}
                      >
                        {shouldShowSendA ? 'Send' : 'Sending'}
                      </SupplyButton>
                    </>
                  )}
                </>
              ) : (
                <TickImg src={TickSrc} />
              )}

              {shouldShowSendBtnB ? (
                <>
                  <Typography mt={2} variant="p" fontWeight="bold" textAlign="center">
                    {parsedAmounts[Field.CURRENCY_B]?.toSignificant(4)} {currencies[Field.CURRENCY_B]?.symbol}
                  </Typography>
                  {shouldSendAssetsB && (
                    <>
                      <Spinner></Spinner>
                      <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                        Confirm the transaction on your Ledger.
                      </Typography>
                    </>
                  )}
                  {!shouldSendAssetsB && (
                    <>
                      <SupplyButton
                        disabled={!shouldShowSendB || shouldSendAssetsA}
                        mt={2}
                        onClick={handleAdd(Field.CURRENCY_B)}
                      >
                        {shouldShowSendB ? 'Send' : 'Sending'}
                      </SupplyButton>
                    </>
                  )}
                </>
              ) : (
                <TickImg src={TickSrc} style={{ marginTop: '15px' }} />
              )}
            </StyledDL>
          </Box>
          <Box width={1 / 2}>
            <StyledDL>
              <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                In contract
              </Typography>

              {baseDeposit?.equalTo(0) ? (
                <>
                  <StyledEmpty>-</StyledEmpty>
                </>
              ) : (
                <>
                  <Typography variant="p" fontWeight="bold" textAlign="center">
                    {baseDeposit?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol}
                  </Typography>
                  {shouldRemoveAssetsA && (
                    <>
                      <Spinner></Spinner>
                      <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                        Confirm the transaction on your Ledger.
                      </Typography>
                    </>
                  )}
                  {!shouldRemoveAssetsA && (
                    <RemoveButton
                      disabled={!shouldShowRemoveA || shouldRemoveAssetsB}
                      mt={2}
                      onClick={handleRemove(Field.CURRENCY_A, baseDeposit)}
                    >
                      {shouldShowRemoveA ? 'Remove' : 'Removing'}
                    </RemoveButton>
                  )}
                </>
              )}

              {quoteDeposit?.equalTo(0) ? (
                <>
                  <StyledEmpty style={{ marginTop: '10px' }}>-</StyledEmpty>
                </>
              ) : (
                <>
                  <Typography mt={2} variant="p" fontWeight="bold" textAlign="center">
                    {quoteDeposit?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}
                  </Typography>
                  {shouldRemoveAssetsB && (
                    <>
                      <Spinner></Spinner>
                      <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                        Confirm the transaction on your Ledger.
                      </Typography>
                    </>
                  )}
                  {!shouldRemoveAssetsB && (
                    <RemoveButton
                      disabled={!shouldShowRemoveB || shouldRemoveAssetsA}
                      mt={2}
                      onClick={handleRemove(Field.CURRENCY_B, quoteDeposit)}
                    >
                      {shouldShowRemoveB ? 'Remove' : 'Removing'}
                    </RemoveButton>
                  )}
                </>
              )}
            </StyledDL>
          </Box>
        </Flex>
        <Typography mt={2} textAlign="center" hidden={isQueue || !isBALNRewardPool}>
          Your assets will be locked for 24 hours. <br />
          To receive BALN, they must be in the pool at 1pm Eastern each day.
        </Typography>
        <Flex alignItems="center" hidden={!isQueue}>
          <Box width={1}>
            <Typography variant="p" fontWeight="bold" textAlign={isQueue ? 'center' : 'right'}>
              {parsedAmounts[Field.CURRENCY_B]?.toSignificant(4)} {currencies[Field.CURRENCY_B]?.symbol}
            </Typography>
            <Typography mt={2} textAlign="center">
              Your ICX will be locked for 24 hours. <br />
              To receive BALN, you must have ICX in the pool at 1pm Eastern each day.
            </Typography>
          </Box>
        </Flex>
        {hasErrorMessage && (
          <Typography textAlign="center" color="alert">
            Remove your assets to cancel this transaction.
          </Typography>
        )}
        <Flex justifyContent="center" mt={4} pt={4} className="border-top">
          {shouldLedgerSign && <Spinner></Spinner>}
          {!shouldLedgerSign && (
            <>
              <TextButton onClick={handleCancelSupply}>Cancel</TextButton>
              <Button disabled={!isEnabled || !hasEnoughICX} onClick={handleSupplyConfirm}>
                {confirmTx ? 'Supplying' : 'Supply'}
              </Button>
            </>
          )}
        </Flex>
        <LedgerConfirmMessage />
        {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
      </Flex>
    </Modal>
  );
}

const SupplyButton = styled(Button)`
  padding: 5px 10px;
  font-size: 12px;
`;

const RemoveButton = styled(SupplyButton)`
  background-color: transparent;
  font-size: 14px;
  color: #fb6a6a;
  padding-top: 4px;
  padding-bottom: 4px;
  margin-top: 6px;
  margin-bottom: 4px;

  &:hover {
    background-color: transparent;
  }

  &:disabled {
    color: #fb6a6a;
    background-color: transparent;
  }
`;

const StyledDL = styled.dl`
  margin: 15px 0 15px 0;
  text-align: center;
`;

const StyledEmpty = styled.dl`
  padding: 18px 0 18px 0;
  text-align: center;
`;

const TickImg = styled.img`
  padding-top: 16px;
  padding-bottom: 16px;
  display: block;
  margin: auto;
  width: 25px;
`;
