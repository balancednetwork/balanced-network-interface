import React, { useEffect } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from '@/app/components/Button';
import { Typography } from '@/app/theme';
import CheckIcon from '@/assets/icons/tick.svg';
import { useEditState } from '@/store/liveVoting/hooks';
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
} from '@balancednetwork/xwagmi';

interface SendRemoveXTokenProps {
  field: Field;
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  currencies: { [field in Field]?: XToken };
}

export function SendRemoveXToken({ field, currencies, parsedAmounts }: SendRemoveXTokenProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [pendingTx, setPendingTx] = React.useState('');

  const currentXTransaction = useXTransactionStore(state => state.transactions[pendingTx]);

  useEffect(() => {
    if (
      currentXTransaction?.status === XTransactionStatus.success ||
      currentXTransaction?.status === XTransactionStatus.failure
    ) {
      refetchDepositAmount()
        .then(() => {
          setIsPending(false);
        })
        .catch(() => {
          setIsPending(false);
        });
    }
  }, [currentXTransaction]);

  const xToken = currencies[field];
  const parsedAmount = parsedAmounts[field];

  const xAccount = useXAccount(getXChainType(xToken?.xChainId));

  const { depositAmount, refetchDepositAmount } = useXTokenDepositAmount(xAccount.address, xToken);

  const depositXToken = useDepositXToken();
  const withdrawXToken = useWithdrawXToken();

  const handleAdd = async () => {
    console.log('add');

    if (!parsedAmount || !xToken || !xAccount) {
      return;
    }

    setIsPending(true);

    try {
      const txHash = await depositXToken(xAccount.address, parsedAmount, xToken);
      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }

    // setIsPending(false);
  };

  const handleRemove = async () => {
    console.log('remove');
    if (!parsedAmount || !xToken || !xAccount) {
      return;
    }

    setIsPending(true);

    try {
      const txHash = await withdrawXToken(xAccount.address, parsedAmount, xToken);
      if (txHash) setPendingTx(txHash);
      else setIsPending(false);
    } catch (error) {
      console.error('error', error);
      setIsPending(false);
    }
  };

  const isDeposited = depositAmount && depositAmount.greaterThan(0);

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

                <SupplyButton disabled={isPending} mt={2} onClick={handleAdd}>
                  {!isPending ? t`Send` : t`Sending`}
                </SupplyButton>
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

                <RemoveButton disabled={isPending} mt={2} onClick={handleRemove}>
                  {!isPending ? t`Remove` : t`Removing`}
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
