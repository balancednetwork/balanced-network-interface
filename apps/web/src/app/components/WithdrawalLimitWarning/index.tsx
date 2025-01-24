import React, { useMemo } from 'react';

import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { Trans, t } from '@lingui/macro';
import { Flex } from 'rebass/styled-components';

import { UnderlineText } from '@/app/components/DropdownText';
import { Typography } from '@/app/theme';
import { useOraclePrices } from '@/store/oracle/hooks';

import QuestionIcon from '@/assets/icons/question.svg';
import { useWithdrawalsFloorDEXData } from '@/store/swap/hooks';
import BigNumber from 'bignumber.js';
import { MouseoverTooltip } from '../Tooltip';

interface WithdrawalLimitWarningProps {
  limitAmount: CurrencyAmount<Currency>;
  onLimitAmountClick: (amount: CurrencyAmount<Currency>) => void;
}

const BridgeLimitWarning: React.FC<WithdrawalLimitWarningProps> = props => {
  const { limitAmount, onLimitAmountClick } = props;
  const prices = useOraclePrices();
  const price = prices[limitAmount.currency.symbol];
  const { data: withdrawalLimits } = useWithdrawalsFloorDEXData();

  const limitData = useMemo(() => {
    const limit = withdrawalLimits?.find(limit => limit.token.symbol === limitAmount.currency.symbol);
    return limit;
  }, [withdrawalLimits, limitAmount.currency.symbol]);

  return (
    <Flex alignItems="center" justifyContent="center" mt={2}>
      <Typography textAlign="center">
        {
          <>
            <Trans>Only</Trans>{' '}
            <UnderlineText onClick={() => onLimitAmountClick(limitAmount)}>
              <Typography color="primaryBright" as="a">
                {limitAmount?.toFixed(
                  price && new BigNumber(price).isGreaterThan(3000)
                    ? 6
                    : price && new BigNumber(price).isGreaterThan(1)
                      ? 4
                      : 2,
                  { groupSeparator: ',' },
                )}{' '}
                {limitAmount?.currency?.symbol}
              </Typography>
            </UnderlineText>{' '}
          </>
        }
        <Trans>available. </Trans>{' '}
        <MouseoverTooltip
          placement="bottom"
          width={300}
          text={t`Only ${limitData?.percentageFloor.times(100).toFixed(2).replace('.00', '')}% can be withdrawn at a time. Limit will be increased gradually over the next ${limitData?.floorTimeDecayInHours.toFixed(0)} hours.`}
        >
          <QuestionIcon width={14} style={{ cursor: 'help', marginTop: -2 }} />
        </MouseoverTooltip>
      </Typography>
    </Flex>
  );
};

export default BridgeLimitWarning;
