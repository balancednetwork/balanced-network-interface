import React from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Currency, Token } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import useAllowanceHandler from 'app/pages/trade/bridge/_hooks/useApproveCallback';
import { XChainId } from 'app/pages/trade/bridge/types';
import { getXTokenBySymbol } from 'app/pages/trade/bridge/utils';
import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import CheckIcon from 'assets/icons/tick.svg';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/reducer';
import { useDerivedMintInfo } from 'store/mint/hooks';
import { useTransactionAdder, TransactionStatus, useTransactionStatus } from 'store/transactions/hooks';
import { useArchwayTransactionsState } from 'store/transactionsCrosschain/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent, { ModalContentWrapper } from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import { depositMessage, supplyMessage } from './utils';
import { XTransactionType, XTransactionInput } from '../../bridge/_zustand/types';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import useXCallFee from '../../bridge/_hooks/useXCallFee';
import { DEFAULT_SLIPPAGE_LP } from 'constants/index';
import { xTransactionActions } from '../../bridge/_zustand/useXTransactionStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  currencies: { [field in Field]?: Currency };
  AChain: XChainId;
  BChain: XChainId;
}

const getPairName = (currencies: { [field in Field]?: Currency }) => {
  return `${currencies[Field.CURRENCY_A]?.symbol} / ${currencies[Field.CURRENCY_B]?.symbol}`;
};

export default function SupplyLiquidityModal({
  isOpen,
  onClose,
  parsedAmounts,
  currencies,
  AChain,
  BChain,
}: ModalProps) {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();

  const { currencyDeposits, pair } = useDerivedMintInfo();
  const addTransaction = useTransactionAdder();

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const { isTxPending } = useArchwayTransactionsState();
  const { increaseAllowance: increaseAllowanceA, isIncreaseNeeded: allowanceIncreaseNeededA } = useAllowanceHandler(
    AChain === 'archway-1' ? getXTokenBySymbol('archway-1', currencies[Field.CURRENCY_A]?.symbol) : undefined,
    parsedAmounts[Field.CURRENCY_A]?.quotient.toString() || '0',
  );

  const [addingTxs, setAddingTxs] = React.useState({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
  const [shouldAddAssets, setShouldAddAssets] = React.useState({
    [Field.CURRENCY_A]: false,
    [Field.CURRENCY_B]: false,
  });

  const [removingTxs, setRemovingTxs] = React.useState({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
  const [shouldRemoveAssets, setShouldRemoveAssets] = React.useState({
    [Field.CURRENCY_A]: false,
    [Field.CURRENCY_B]: false,
  });

  const handleRemove = (field: Field, amountWithdraw?: CurrencyAmount<Currency>) => async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const token = currencies[field] as Token;

    try {
      if (bnJs.contractSettings.ledgerSettings.actived) {
        setShouldRemoveAssets({ ...shouldRemoveAssets, [field]: true });
      }

      const res: any = await bnJs.inject({ account }).Dex.withdraw(token.address, toDec(amountWithdraw));
      addTransaction(
        { hash: res.result },
        {
          pending: t`Withdrawing ${token.symbol}`,
          summary: t`${amountWithdraw?.toSignificant(6)} ${token.symbol} added to your wallet`,
        },
      );

      setRemovingTxs(state => ({ ...state, [field]: res.result }));
    } catch (error) {
      console.error('error', error);
      setRemovingTxs(state => ({ ...state, [field]: '' }));
    } finally {
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      setShouldRemoveAssets({ ...shouldRemoveAssets, [field]: false });
    }
  };

  const [confirmTx, setConfirmTx] = React.useState('');

  const handleSupplyConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    if (isQueue) {
      const t = parsedAmounts[Field.CURRENCY_A];

      bnJs
        .inject({ account })
        .Dex.transferICX(toDec(t))
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: supplyMessage(currencies[Field.CURRENCY_A]?.symbol!).pendingMessage,
              summary: supplyMessage(currencies[Field.CURRENCY_A]?.symbol!).successMessage,
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
          toDec(currencyDeposits[Field.CURRENCY_A]),
          toDec(currencyDeposits[Field.CURRENCY_B]),
          DEFAULT_SLIPPAGE_LP,
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    if (!isOpen) {
      setAddingTxs({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
      setRemovingTxs({ [Field.CURRENCY_A]: '', [Field.CURRENCY_B]: '' });
      setConfirmTx('');
      setHasErrorMessage(false);
    }
  }, [isOpen, pair]);

  const addingATxStatus: TransactionStatus | undefined = useTransactionStatus(addingTxs[Field.CURRENCY_A]);
  const addingBTxStatus: TransactionStatus | undefined = useTransactionStatus(addingTxs[Field.CURRENCY_B]);

  const removingATxStatus: TransactionStatus | undefined = useTransactionStatus(removingTxs[Field.CURRENCY_A]);
  const removingBTxStatus: TransactionStatus | undefined = useTransactionStatus(removingTxs[Field.CURRENCY_B]);

  const isQueue = !!(pair && pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX);

  const isEnabled = isQueue
    ? true
    : !!currencyDeposits[Field.CURRENCY_A]?.greaterThan(0) && !!currencyDeposits[Field.CURRENCY_B]?.greaterThan(0);

  const UIStatus = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: {
        shouldSend: !!!currencyDeposits[Field.CURRENCY_A]?.greaterThan(0),
        // isAddPending: !!addingTxs[Field.CURRENCY_A],
        isAddPending: addingATxStatus === TransactionStatus.pending || isTxPending,
        // isRemovePending: !!removingTxs[Field.CURRENCY_A],
        isRemovePending: removingATxStatus === TransactionStatus.pending,
        isAllowanceIncreaseNeeded: allowanceIncreaseNeededA,
        chain: AChain,
      },
      [Field.CURRENCY_B]: {
        shouldSend: !!!currencyDeposits[Field.CURRENCY_B]?.greaterThan(0),
        // isAddPending: !!addingTxs[Field.CURRENCY_B],
        isAddPending: addingBTxStatus === TransactionStatus.pending,
        // isRemovePending: !!removingTxs[Field.CURRENCY_B],
        isRemovePending: removingBTxStatus === TransactionStatus.pending,
        isAllowanceIncreaseNeeded: false,
        chain: BChain,
      },
    }),
    [
      AChain,
      BChain,
      addingATxStatus,
      addingBTxStatus,
      allowanceIncreaseNeededA,
      currencyDeposits,
      isTxPending,
      removingATxStatus,
      removingBTxStatus,
    ],
  );

  const [hasErrorMessage, setHasErrorMessage] = React.useState(false);
  const handleCancelSupply = () => {
    if (UIStatus[Field.CURRENCY_A].shouldSend && UIStatus[Field.CURRENCY_B].shouldSend) {
      onClose();
    } else {
      setHasErrorMessage(true);
    }
    changeShouldLedgerSign(false);
  };

  const hasEnoughICX = useHasEnoughICX();

  const executeCallback = React.useCallback((success: boolean) => {
    setAddingTxs(state => ({ ...state, CURRENCY_A: success ? 'success' : '' }));
  }, []);

  const { xCallFee } = useXCallFee(AChain, ICON_XCALL_NETWORK_ID);

  const handleAddArchway = async (field: Field) => {
    const inputAmount = parsedAmounts[field];
    if (inputAmount && accountArch && xCallFee) {
      const xTransactionInput: XTransactionInput = {
        type: XTransactionType.SUPPLY,
        direction: {
          from: AChain,
          to: ICON_XCALL_NETWORK_ID,
        },
        inputAmount: inputAmount,
        recipient: bnJs.Dex.address,
        account: accountArch,
        xCallFee,
      };
      // await xTransactionActions.sendXToken(xTransactionInput, () => executeCallback(true));
    }
  };

  const handleAddICON = async (field: Field) => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const token = currencies[field] as Token;

    try {
      if (bnJs.contractSettings.ledgerSettings.actived) {
        setShouldAddAssets({ ...shouldAddAssets, [field]: true });
      }

      const res: any = await bnJs.inject({ account }).getContract(token.address).deposit(toDec(parsedAmounts[field]));

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
      setAddingTxs(state => ({ ...state, [field]: '' }));
    } finally {
      window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      setShouldAddAssets({ ...shouldAddAssets, [field]: false });
    }
  };

  const handleAdd = (field: Field) => () => {
    if (UIStatus[field].chain === 'archway-1') {
      handleAddArchway(field);
    } else if (UIStatus[field].chain === '0x1.icon') {
      handleAddICON(field);
    }
  };

  const isXCallModalOpen =
    false && UIStatus[Field.CURRENCY_A].chain !== '0x1.icon' && !UIStatus[Field.CURRENCY_A].isAddPending;

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={() => undefined}>
        <ModalContent>
          <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
            {pair ? t`Supply liquidity?` : t`Create liquidity pool?`}
          </Typography>
          <Typography variant="p" textAlign="center" mb={4} hidden={isQueue}>
            <Trans>Send each asset to the contract</Trans>, <br />
            {pair ? t`then click Supply.` : t`then create the pool.`}
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
                  <Trans>Assets to send</Trans>
                </Typography>

                {[Field.CURRENCY_A, Field.CURRENCY_B].map((field: Field) => (
                  <Box key={field} my={1}>
                    {UIStatus[field].shouldSend ? (
                      <>
                        <Typography variant="p" fontWeight="bold" textAlign="center">
                          {parsedAmounts[field]?.toSignificant(6)} {currencies[field]?.symbol}
                        </Typography>
                        {shouldAddAssets[field] && (
                          <>
                            <Spinner></Spinner>
                            <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                              <Trans>Confirm the transaction on your Ledger.</Trans>
                            </Typography>
                          </>
                        )}
                        {UIStatus[field].isAllowanceIncreaseNeeded ? (
                          <SupplyButton disabled={isTxPending} mt={2} onClick={increaseAllowanceA}>
                            {isTxPending ? `Approving...` : `Approve`}
                          </SupplyButton>
                        ) : (
                          !shouldAddAssets[field] && (
                            <>
                              <SupplyButton
                                disabled={
                                  UIStatus[field].isAddPending ||
                                  shouldAddAssets[field === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A]
                                }
                                mt={2}
                                onClick={handleAdd(field)}
                              >
                                {!UIStatus[field].isAddPending ? t`Send` : t`Sending`}
                              </SupplyButton>
                            </>
                          )
                        )}
                      </>
                    ) : (
                      <CheckIconWrapper>
                        <CheckIcon />
                      </CheckIconWrapper>
                    )}
                  </Box>
                ))}
              </StyledDL>
            </Box>
            <Box width={1 / 2}>
              <StyledDL>
                <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                  <Trans>In contract</Trans>
                </Typography>

                {[Field.CURRENCY_A, Field.CURRENCY_B].map((field: Field) => (
                  <Box key={field} my={1}>
                    {UIStatus[field].shouldSend ? (
                      <>
                        <StyledEmpty>-</StyledEmpty>
                      </>
                    ) : (
                      <>
                        <Typography variant="p" fontWeight="bold" textAlign="center">
                          {currencyDeposits[field]?.toSignificant(6)} {currencies[field]?.symbol}
                        </Typography>
                        {shouldRemoveAssets[field] && (
                          <>
                            <Spinner></Spinner>
                            <Typography textAlign="center" mb={2} as="h3" fontWeight="normal">
                              <Trans>Confirm the transaction on your Ledger.</Trans>
                            </Typography>
                          </>
                        )}
                        {!shouldRemoveAssets[field] && (
                          <RemoveButton
                            disabled={
                              UIStatus[field].isRemovePending ||
                              shouldRemoveAssets[field === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A]
                            }
                            mt={2}
                            onClick={handleRemove(field, currencyDeposits[field])}
                          >
                            {!UIStatus[field].isRemovePending ? t`Remove` : t`Removing`}
                          </RemoveButton>
                        )}
                      </>
                    )}
                  </Box>
                ))}
              </StyledDL>
            </Box>
          </Flex>
          <Flex alignItems="center" hidden={!isQueue}>
            <Box width={1}>
              <Typography fontWeight="bold" textAlign={isQueue ? 'center' : 'right'} fontSize="20px" as="h3">
                {parsedAmounts[Field.CURRENCY_A]?.toSignificant(4)} {currencies[Field.CURRENCY_A]?.symbol}
              </Typography>
              <Typography mt={2} textAlign="center">
                <Trans>
                  This pool works like a queue, so your ICX is gradually converted to sICX. You'll earn BALN until this
                  happens.
                </Trans>
              </Typography>
            </Box>
          </Flex>
          {hasErrorMessage && (
            <Typography textAlign="center" color="alert">
              <Trans>Remove your assets to cancel this transaction.</Trans>
            </Typography>
          )}
          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleCancelSupply}>
                  <Trans>Cancel</Trans>
                </TextButton>

                {pair ? (
                  <Button disabled={!isEnabled || !hasEnoughICX} onClick={handleSupplyConfirm}>
                    {confirmTx ? t`Supplying` : t`Supply`}
                  </Button>
                ) : (
                  <Button disabled={!isEnabled || !hasEnoughICX} onClick={handleSupplyConfirm}>
                    {confirmTx ? t`Creating pool` : t`Create pool`}
                  </Button>
                )}
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
      {UIStatus[Field.CURRENCY_A].chain !== '0x1.icon' && (
        <Modal isOpen={isXCallModalOpen} onDismiss={() => {}}>
          <ModalContentWrapper>
            <Typography mb={3} textAlign="center" fontSize={16}>
              {t`Transfer ${currencies[Field.CURRENCY_A]?.symbol} to ICON.`}
            </Typography>
          </ModalContentWrapper>
        </Modal>
      )}
    </>
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

const CheckIconWrapper = styled.div`
  padding-top: 16px;
  padding-bottom: 16px;
  display: block;
  margin: auto;
  width: 25px;
`;
