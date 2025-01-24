import React, { useEffect, useState } from 'react';

import { Flex } from 'rebass/styled-components';

import { Typography } from '@/app/theme';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XChainId, XToken, isAccountNonExistent, useXAccount } from '@balancednetwork/xwagmi';
import { UnderlineText } from '../DropdownText';

const SOL_MINIMUM_AMOUNT = 2000000; // 0.002 * 10^9

export const useCheckSolanaAccount = (
  destinationChainId: XChainId,
  currencyAmount: CurrencyAmount<XToken> | undefined,
  recipient: string,
) => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const checkAccount = async () => {
      if (destinationChainId === 'solana' && recipient && currencyAmount?.currency.symbol === 'SOL') {
        if ((await isAccountNonExistent(recipient)) && currencyAmount.lessThan(SOL_MINIMUM_AMOUNT)) {
          setIsActive(false);
        } else {
          setIsActive(true);
        }
      }
    };

    checkAccount();
  }, [destinationChainId, currencyAmount, recipient]);

  return isActive;
};

const SolanaAccountExistenceWarning = ({
  destinationChainId,
  currencyAmount,
  recipient,
  onActivate,
}: {
  destinationChainId: XChainId;
  currencyAmount: CurrencyAmount<XToken> | undefined;
  recipient: string;
  onActivate?: () => void;
}) => {
  const isActive = useCheckSolanaAccount(destinationChainId, currencyAmount, recipient);

  if (isActive) {
    return <></>;
  }

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={2}>
      {/* <Typography textAlign="center">Solana wallet inactive. Send at least</Typography> */}
      <Typography textAlign="center">
        Send at least{' '}
        {onActivate ? (
          <UnderlineText onClick={onActivate}>
            <Typography color="primaryBright" as="a">
              0.002 SOL
            </Typography>
          </UnderlineText>
        ) : (
          <Typography as="span">0.002 SOL</Typography>
        )}{' '}
        to activate it.
      </Typography>
    </Flex>
  );
};

export default SolanaAccountExistenceWarning;
