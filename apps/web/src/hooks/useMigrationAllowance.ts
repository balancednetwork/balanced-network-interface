import { ApprovalState } from '@/hooks/useApproveCallback';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { sodax } from '@/lib/sodax';
import { XChainId, getXChainType } from '@balancednetwork/xwagmi';
import { SpokeChainId, UnifiedBnUSDMigrateParams } from '@sodax/sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';

type AllowanceState = {
  params?: UnifiedBnUSDMigrateParams;
  hasAllowance: boolean;
};

export const useMigrationAllowance = (
  revertParams: UnifiedBnUSDMigrateParams | undefined,
  sourceChain: SpokeChainId | undefined,
) => {
  const sourceSpokeProvider = useSpokeProvider(sourceChain);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [allowanceState, setAllowanceState] = useState<AllowanceState>({ hasAllowance: false });
  const hasAllowance = allowanceState.params === revertParams && allowanceState.hasAllowance;

  // Check if this is an EVM chain
  const isEVMChain = useMemo(() => {
    return getXChainType(sourceChain as XChainId) === 'EVM';
  }, [sourceChain]);

  const checkAllowance = useCallback(async () => {
    if (!isEVMChain) {
      return { ok: false, error: new Error('Only EVM chains are supported') };
    }
    if (!revertParams || !sourceSpokeProvider) {
      return { ok: false, error: new Error('Missing params or provider') };
    }

    return await sodax.migration.isAllowanceValid(revertParams, 'revert', sourceSpokeProvider);
  }, [isEVMChain, revertParams, sourceSpokeProvider]);

  const approve = useCallback(async () => {
    if (!isEVMChain) {
      return { ok: false, error: new Error('Only EVM chains are supported') };
    }
    if (!revertParams || !sourceSpokeProvider) {
      return { ok: false, error: new Error('Missing params or provider') };
    }

    setIsApproving(true);
    try {
      const result = await sodax.migration.approve(revertParams, 'revert', sourceSpokeProvider);
      if (result.ok && 'value' in result) {
        // Wait for transaction receipt
        const receipt = await (sourceSpokeProvider.walletProvider as any).waitForTransactionReceipt(
          result.value as `0x${string}`,
        );
        console.log('Reverse migration approval successful!', { receipt });
        setAllowanceState({ params: revertParams, hasAllowance: true });
      }
      return result;
    } catch (error) {
      console.error('Approval error:', error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  }, [isEVMChain, revertParams, sourceSpokeProvider]);

  // Check allowance on mount and when dependencies change (only for EVM chains)
  useEffect(() => {
    let cancelled = false;

    const checkAllowanceStatus = async () => {
      if (!isEVMChain || !revertParams || !sourceChain) {
        setIsCheckingAllowance(false);
        return;
      }

      setIsCheckingAllowance(true);
      try {
        const result = await checkAllowance();
        if (cancelled) return;

        if (result.ok && 'value' in result) {
          setAllowanceState({ params: revertParams, hasAllowance: result.value });
        } else {
          console.error('Error checking allowance:', result.error);
          setAllowanceState({ params: revertParams, hasAllowance: false });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error checking allowance:', error);
        setAllowanceState({ params: revertParams, hasAllowance: false });
      } finally {
        if (!cancelled) setIsCheckingAllowance(false);
      }
    };

    checkAllowanceStatus();

    return () => {
      cancelled = true;
    };
  }, [isEVMChain, revertParams, sourceChain, checkAllowance]);

  const approvalState = useMemo(() => {
    if (!isEVMChain) return ApprovalState.APPROVED; // No approval needed for non-EVM chains
    if (isCheckingAllowance) return ApprovalState.UNKNOWN;
    if (isApproving) return ApprovalState.PENDING;
    if (hasAllowance) return ApprovalState.APPROVED;
    return ApprovalState.NOT_APPROVED;
  }, [isEVMChain, isCheckingAllowance, isApproving, hasAllowance]);

  const isAllowanceValid = useMemo(() => {
    if (!isEVMChain) return true; // No approval needed for non-EVM chains
    return hasAllowance;
  }, [isEVMChain, hasAllowance]);

  return {
    checkAllowance,
    approve,
    approvalState,
    isAllowanceValid,
    isCheckingAllowance,
    isApproving,
    hasAllowance,
    sourceSpokeProvider,
  };
};
