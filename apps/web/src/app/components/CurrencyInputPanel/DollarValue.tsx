import React, { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { formatValue } from '@/utils/formatter';

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
  const [animationIntensity, setAnimationIntensity] = useState(0);

  useEffect(() => {
    if (price && amount && amount !== '0' && amount !== '.') {
      setDollarValue(formatValue(price.times(amount || 0).toFixed()));
    } else {
      setDollarValue('$0');
    }
  }, [price, amount]);

  useEffect(() => {
    if (price && amount && amount !== '0' && amount !== '.') {
      setAnimationIntensity(Math.min(Math.abs(price.times(amount || 0).toNumber()) / 1000, 0.09));
    } else {
      setAnimationIntensity(0);
    }
  }, [price, amount]);

  return (
    <motion.div
      key={dollarValue}
      style={{ transformOrigin: 'center' }}
      initial={{ opacity: 0, y: 0, x: 20 * animationIntensity, scale: 1 + animationIntensity }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <DollarValueWrap $warn={!!showWarning}>{dollarValue}</DollarValueWrap>
    </motion.div>
  );
};

export default DollarValue;
