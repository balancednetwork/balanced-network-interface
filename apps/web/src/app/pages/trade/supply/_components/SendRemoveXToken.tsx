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
import { useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

interface SendRemoveXTokenProps {
  field: Field;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  currencies: { [field in Field]?: XToken };
  onResetError: () => void;
}

enum SendState {
  NONE,
  SIGNING,
  SENDING,
  SENT_SUCCESS,
  SENT_FAILURE,
}

enum RemoveState {
  NONE,
  SIGNING,
  SENDING,
  SENT_SUCCESS,
  SENT_FAILURE,
}

export function SendRemoveXToken({ field, currencies, parsedAmounts, onResetError }: SendRemoveXTokenProps) {
  const queryClient = useQueryClient();
  const { lpXChainId } = useDerivedMintInfo();

  const [pendingTx, setPendingTx] = React.useState('');
  const [sendState, setSendState] = React.useState<SendState>(SendState.NONE);
  const [removeState, setRemoveState] = React.useState<RemoveState>(RemoveState.NONE);
  const currentXTransaction = useXTransactionStore(state => state.transactions[pendingTx]);

  useEffect(() => {
    if (
      currentXTransaction?.status === XTransactionStatus.success ||
      currentXTransaction?.status === XTransactionStatus.failure
    ) {
      queryClient.invalidateQueries({ queryKey: ['XTokenDepositAmount'] });
      if (sendState === SendState.SENDING) {
        setSendState(
          currentXTransaction?.status === XTransactionStatus.success ? SendState.SENT_SUCCESS : SendState.SENT_FAILURE,
        );
        setRemoveState(RemoveState.NONE);
      }

      if (removeState === RemoveState.SENDING) {
        setRemoveState(
          currentXTransaction?.status === XTransactionStatus.success
            ? RemoveState.SENT_SUCCESS
            : RemoveState.SENT_FAILURE,
        );
        setSendState(SendState.NONE);
      }
    }
  }, [currentXTransaction, queryClient, removeState, sendState]);

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

  const { data: depositAmount } = useXTokenDepositAmount(xAccount.address, xToken);

  const depositXToken = useDepositXToken();
  const withdrawXToken = useWithdrawXToken();

  const handleAdd = async () => {
    if (!parsedAmount || !xToken || !xAccount || !amountToDeposit) {
      return;
    }
    onResetError();
    setSendState(SendState.SIGNING);
    try {
      const txHash = await depositXToken(xAccount.address, amountToDeposit);
      if (txHash) {
        setPendingTx(txHash);
        setSendState(SendState.SENDING);
      } else {
        setSendState(SendState.NONE);
      }
    } catch (error) {
      console.error('error', error);
      setSendState(SendState.NONE);
    }
  };

  const handleRemove = async () => {
    console.log('remove');
    if (!depositAmount || !xToken || !xAccount) {
      return;
    }
    onResetError();
    setRemoveState(RemoveState.SIGNING);
    try {
      const txHash = await withdrawXToken(xAccount.address, depositAmount);
      if (txHash) {
        setPendingTx(txHash);
        setRemoveState(RemoveState.SENDING);
      } else {
        setRemoveState(RemoveState.NONE);
      }
    } catch (error) {
      console.error('error', error);
      setRemoveState(RemoveState.NONE);
    }
  };

  const isDeposited = depositAmount && depositAmount.greaterThan(0);
  const { isWrongChain } = useEvmSwitchChain(lpXChainId);

  const isSendPending = sendState === SendState.SIGNING || sendState === SendState.SENDING;
  const isRemovePending = removeState === RemoveState.SIGNING || removeState === RemoveState.SENDING;

  return (
    <Flex alignItems="center" mb={1} hidden={false}>
      <Box width={1 / 2}>
        <StyledDL>
          <Box my={1}>
            {!isDeposited ? (
              <>
                <Typography variant="p" fontWeight="bold" textAlign="center">
                  {parsedAmount?.toSignificant(6)} {xToken?.symbol}
                </Typography>

                {!isSendPending && approvalState !== ApprovalState.APPROVED ? (
                  <SupplyButton
                    disabled={approvalState === ApprovalState.PENDING || isWrongChain}
                    mt={2}
                    onClick={approveCallback}
                  >
                    {approvalState !== ApprovalState.PENDING ? t`Approve` : t`Approving`}
                  </SupplyButton>
                ) : (
                  <SupplyButton disabled={isSendPending || isWrongChain} mt={2} onClick={handleAdd}>
                    {(sendState === SendState.NONE || sendState === SendState.SIGNING) && t`Send`}
                    {sendState === SendState.SENDING && t`Sending`}
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
                  {depositAmount?.toSignificant(6)} {xToken?.symbol}
                </Typography>

                <RemoveButton disabled={isRemovePending || isWrongChain} mt={2} onClick={handleRemove}>
                  {(removeState === RemoveState.NONE || removeState === RemoveState.SIGNING) && t`Remove`}
                  {removeState === RemoveState.SENDING && t`Removing`}
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
