import React, { useMemo } from 'react';
import { XTransaction } from '@/xwagmi/xcall/types';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { allXTokens } from '@/xwagmi/constants/xTokens';

interface HistoryItemProps {
  xTransaction: XTransaction;
}

const HistoryItem = ({ xTransaction }: HistoryItemProps) => {
  const usdcOnArbitrum = allXTokens.find(xToken => xToken.symbol === 'USDC' && xToken.xChainId === '0xa4b1.arbitrum');
  const icx = allXTokens.find(xToken => xToken.symbol === 'ICX' && xToken.xChainId === '0x1.icon');
  return <div className="relative bg-[#221542] p-2 rounded-xl flex flex-col gap-2"></div>;
};

export default HistoryItem;
