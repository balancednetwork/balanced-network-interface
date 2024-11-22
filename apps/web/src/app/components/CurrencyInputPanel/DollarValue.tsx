import { SLIPPAGE_WARNING_THRESHOLD } from '@/constants/misc';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { formatValue } from '@/utils/formatter';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { duration } from 'dayjs';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface DollarValueProps {
  amount: string;
  showWarning: boolean;
  price?: BigNumber;
}

const DollarValueWrap = styled.div<{ $warn: boolean }>`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.75;
  position: absolute;
  right: 17px;
  top: 28px;
  width: 100px;
  text-align: right;
  ${({ $warn, theme }) => $warn && `color: ${theme.colors.alert};`}
`;

const DollarValue: React.FC<DollarValueProps> = ({ amount, price, showWarning }) => {
  const [dollarValue, setDollarValue] = useState('$0');
  const [wiggleIntensity, setWiggleIntensity] = useState(0);
  const { trade } = useDerivedSwapInfo();

  const showSlippageWarning = showWarning && trade?.priceImpact.greaterThan(SLIPPAGE_WARNING_THRESHOLD);

  useEffect(() => {
    if (price && amount && amount !== '0') {
      setDollarValue(formatValue(price.times(amount || 0).toFixed()));
    } else {
      setDollarValue('$0');
    }
  }, [price, amount]);

  useEffect(() => {
    if (price && amount && amount !== '0') {
      setWiggleIntensity(Math.min(Math.abs(price.times(amount).toNumber()) / 100, 1));
    } else {
      setWiggleIntensity(0);
    }
  }, [price, amount]);

  return (
    <motion.div
      key={dollarValue}
      initial={{ opacity: 0, x: -wiggleIntensity * 5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ opacity: { duration: 0.2 }, x: { type: 'spring', stiffness: 800, damping: 10 } }}
    >
      <DollarValueWrap $warn={!!showSlippageWarning}>{dollarValue}</DollarValueWrap>
    </motion.div>
  );
};

export default DollarValue;
