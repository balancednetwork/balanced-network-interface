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
}

export function SendRemoveXToken({ field, currencies, parsedAmounts, onResetError }: SendRemoveXTokenProps) {
  const { lpXChainId } = useDerivedMintInfo();

  const [isPending, setIsPending] = React.useState(false);
  const [isSigning, setIsSigning] = React.useState(false);
  const [pendingTx, setPendingTx] = React.useState('');

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
        setIsPending(false);
        setPendingTx('');
      }
    };

    invalidateAndClear();
  }, [currentXTransaction, refetch]);

  useEffect(() => {
    if (currentXTransaction?.status === XTransactionStatus.failure) {
      setIsPending(false);
      setPendingTx('');
    }
  }, [currentXTransaction]);

  const depositXToken = useDepositXToken();
  const withdrawXToken = useWithdrawXToken();

  const handleAdd = async () => {
    console.log('add');

    if (!parsedAmount || !xToken || !xAccount || !amountToDeposit) {
      return;
    }
    onResetError();
    setIsPending(true);

    try {
      setIsSigning(true);
      const txHash = await depositXToken(xAccount.address, amountToDeposit);
      setIsSigning(false);

      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }
  };

  const handleRemove = async () => {
    console.log('remove');
    if (!depositAmount || !xToken || !xAccount) {
      return;
    }
    onResetError();
    setIsPending(true);

    try {
      setIsSigning(true);
      const txHash = await withdrawXToken(xAccount.address, depositAmount);
      setIsSigning(false);

      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }
  };

  const isDeposited = depositAmount && depositAmount.greaterThan(0);
  const { isWrongChain } = useEvmSwitchChain(lpXChainId);

  return (
    <Flex alignItems="center" mb={1} hidden={false}>
      <Box width={1 / 2}>
        <StyledDL>
          <Box my={1}>
            {!isDeposited ? (
              <>
                <Typography variant="p" fontWeight="bold" textAlign="center">
                  {parsedAmount?.toSignificant(6)} {formatSymbol(xToken?.symbol)}
                </Typography>

                {!isPending && approvalState !== ApprovalState.APPROVED ? (
                  <SupplyButton
                    disabled={approvalState === ApprovalState.PENDING || isWrongChain}
                    mt={2}
                    onClick={approveCallback}
                  >
                    {approvalState !== ApprovalState.PENDING ? t`Approve` : t`Approving`}
                  </SupplyButton>
                ) : (
                  <SupplyButton disabled={isPending || isWrongChain} mt={2} onClick={handleAdd}>
                    {!isPending && 'Send'}
                    {isPending && isSigning && 'Send'}
                    {isPending && !isSigning && 'Sending'}
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

                <RemoveButton disabled={isPending || isWrongChain} mt={2} onClick={handleRemove}>
                  {!isPending && 'Remove'}
                  {isPending && isSigning && 'Remove'}
                  {isPending && !isSigning && 'Removing'}
                </RemoveButton>
              </>
            )}
          </Box>
        </StyledDL>
      </Box>
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
