import { useDerivedCollateralInfo } from '@/store/collateral/hooks';
import { useDerivedLoanInfo, useLoanRecipientNetwork, useLoanState } from '@/store/loan/hooks';
import { XChainId } from '@/xwagmi/types';
import { useMemo } from 'react';

const useLoanWalletServiceHandler = (): XChainId => {
  const { isAdjusting: isLoanAdjusting } = useLoanState();
  const { sourceChain: collateralChain } = useDerivedCollateralInfo();
  const loanChain = useLoanRecipientNetwork();
  const { differenceAmount } = useDerivedLoanInfo();
  const shouldBorrow = differenceAmount.isPositive();

  const activeChain: XChainId = useMemo(() => {
    if (isLoanAdjusting) {
      if (shouldBorrow) return collateralChain;
      return loanChain;
    }
    return collateralChain;
  }, [collateralChain, loanChain, shouldBorrow, isLoanAdjusting]);

  return activeChain;
};

export default useLoanWalletServiceHandler;
