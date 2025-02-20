import React, { useEffect } from 'react';

import { t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from '@/app/components/Button';
import { Typography } from '@/app/theme';
import CheckIcon from '@/assets/icons/tick.svg';
import { ApprovalState, useApproveCallback } from '@/hooks/useApproveCallback';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import { useDerivedMintInfo } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { formatSymbol } from '@/utils/formatter';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  XToken,
  XTransactionStatus,
  getXChainType,
  useDepositXToken,
  useWithdrawXToken,
  useXAccount,
  useXTokenDepositAmount,
  useXTransactionStore,
  xChainMap,
} from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';

interface SendRemoveXTokenProps {
  field: Field;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  currencies: { [field in Field]?: XToken };
  onResetError: () => void;
  isSending: boolean;
  isRemoving: boolean;
  pendingTx: string;
  isSigning: boolean;
  setIsSending: (isSending: boolean) => void;
  setIsRemoving: (isRemoving: boolean) => void;
  setIsSigning: (isSigning: boolean) => void;
  setPendingTx: (tx: string) => void;
  isSupplying?: boolean;
  executionDepositAmount?: CurrencyAmount<XToken>;
}

export function SendRemoveXToken({
  field,
  currencies,
  parsedAmounts,
  onResetError,
  isSending,
  isRemoving,
  setIsSending,
  setIsRemoving,
  isSigning,
  setIsSigning,
  pendingTx,
  setPendingTx,
  isSupplying,
  executionDepositAmount,
}: SendRemoveXTokenProps) {
  const { lpXChainId } = useDerivedMintInfo();

  const currentXTransaction = useXTransactionStore(state => state.transactions[pendingTx]);

  const xToken: XToken | undefined = React.useMemo(() => currencies[field]?.wrapped, [currencies, field]);
  const parsedAmount = parsedAmounts[field];

  const amountToDeposit = React.useMemo(() => {
    if (!xToken || !parsedAmount) return;
    return CurrencyAmount.fromRawAmount(
      xToken,
      new BigNumber(parsedAmount.toFixed()).times((10n ** BigInt(xToken.decimals)).toString()).toFixed(0),
    );
  }, [xToken, parsedAmount]);

  const { approvalState, approveCallback } = useApproveCallback(
    amountToDeposit,
    xToken ? xChainMap[xToken.xChainId].contracts.assetManager : undefined,
  );

  const xAccount = useXAccount(getXChainType(xToken?.xChainId));

  const { data: depositAmount, refetch } = useXTokenDepositAmount(xAccount.address, xToken);

  useEffect(() => {
    const invalidateAndClear = async () => {
      if (currentXTransaction?.status === XTransactionStatus.success) {
        await refetch();
        setIsSending(false);
        setIsRemoving(false);
        setPendingTx('');
      }
    };

    invalidateAndClear();
  }, [currentXTransaction, refetch, setIsSending, setIsRemoving, setPendingTx]);

  useEffect(() => {
    if (currentXTransaction?.status === XTransactionStatus.failure) {
      setIsSending(false);
      setIsRemoving(false);
      setPendingTx('');
    }
  }, [currentXTransaction, setIsSending, setIsRemoving, setPendingTx]);

  const depositXToken = useDepositXToken();
  const withdrawXToken = useWithdrawXToken();

  const handleAdd = async () => {
    console.log('add');

    if (!parsedAmount || !xToken || !xAccount || !amountToDeposit) {
      return;
    }
    onResetError();
    setIsSending(true);

    try {
      setIsSigning(true);
      const txHash = await depositXToken(xAccount.address, amountToDeposit);
      setIsSigning(false);

      if (txHash) setPendingTx(txHash);
      else setIsSending(false);
    } catch (error) {
      console.error('error', error);
      setIsSending(false);
    }
  };

  const handleRemove = async () => {
    console.log('remove');
    if (!depositAmount || !xToken || !xAccount) {
      return;
    }
    onResetError();
    setIsRemoving(true);

    try {
      setIsSigning(true);
      const txHash = await withdrawXToken(xAccount.address, depositAmount);
      setIsSigning(false);

      if (txHash) setPendingTx(txHash);
      else setIsRemoving(false);
    } catch (error) {
      console.error('error', error);
      setIsRemoving(false);
    }
  };

  const isDeposited = depositAmount && depositAmount.greaterThan(0);
  const { isWrongChain } = useEvmSwitchChain(lpXChainId);

  return (
    <Flex alignItems="center" mb={1} hidden={false}>
      {isSupplying ? (
        <>
          <Box width={1 / 2}>
            <StyledDL>
              <Box my={1}>
                <CheckIconWrapper>
                  <CheckIcon />
                </CheckIconWrapper>
              </Box>
            </StyledDL>
          </Box>
          <Box width={1 / 2}>
            <StyledDL>
              <Box my={1}>
                <Typography variant="p" fontWeight="bold" textAlign="center">
                  {executionDepositAmount?.toSignificant(6)} {formatSymbol(xToken?.symbol)}
                </Typography>
                <RemoveButton disabled={true} mt={2}>
                  Remove
                </RemoveButton>
              </Box>
            </StyledDL>
          </Box>
        </>
      ) : (
        <>
          <Box width={1 / 2}>
            <StyledDL>
              <Box my={1}>
                {!isDeposited ? (
                  <>
                    <Typography variant="p" fontWeight="bold" textAlign="center">
                      {parsedAmount?.toSignificant(6)} {formatSymbol(xToken?.symbol)}
                    </Typography>

                    {!isSending && approvalState !== ApprovalState.APPROVED ? (
                      <SupplyButton
                        disabled={approvalState === ApprovalState.PENDING || isWrongChain}
                        mt={2}
                        onClick={approveCallback}
                      >
                        {approvalState !== ApprovalState.PENDING ? t`Approve` : t`Approving`}
                      </SupplyButton>
                    ) : (
                      <SupplyButton disabled={isSending || isWrongChain} mt={2} onClick={handleAdd}>
                        {!isSending && 'Send'}
                        {isSending && isSigning && 'Send'}
                        {isSending && !isSigning && 'Sending'}
                      </SupplyButton>
                    )}
                  </>
                ) : (
                  <CheckIconWrapper>
                    <CheckIcon />
                  </CheckIconWrapper>
                )}
              </Box>
            </StyledDL>
          </Box>
          <Box width={1 / 2}>
            <StyledDL>
              <Box my={1}>
                {!isDeposited ? (
                  <>
                    <StyledEmpty>-</StyledEmpty>
                  </>
                ) : (
                  <>
                    <Typography variant="p" fontWeight="bold" textAlign="center">
                      {depositAmount?.toSignificant(6)} {formatSymbol(xToken?.symbol)}
                    </Typography>

                    <RemoveButton disabled={isRemoving || isWrongChain} mt={2} onClick={handleRemove}>
                      {!isRemoving && 'Remove'}
                      {isRemoving && isSigning && 'Remove'}
                      {isRemoving && !isSigning && 'Removing'}
                    </RemoveButton>
                  </>
                )}
              </Box>
            </StyledDL>
          </Box>
        </>
      )}
    </Flex>
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
  margin: 10px 0 10px 0;
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
