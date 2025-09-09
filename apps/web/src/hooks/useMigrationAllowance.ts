import { useCallback, useMemo, useEffect, useState } from 'react';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { ApprovalState } from '@/hooks/useApproveCallback';
import { sodax } from '@/lib/sodax';
import { IcxCreateRevertMigrationParams, SpokeChainId, UnifiedBnUSDMigrateParams } from '@sodax/sdk';
import { getXChainType, XChainId } from '@balancednetwork/xwagmi';

export const useMigrationAllowance = (
  revertParams: IcxCreateRevertMigrationParams | UnifiedBnUSDMigrateParams | undefined,
  sourceChain: SpokeChainId | undefined,
) => {
  const sourceSpokeProvider = useSpokeProvider(sourceChain);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [hasAllowance, setHasAllowance] = useState(false);

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
        console.log('ICX revert approval successful!', { receipt });
        setHasAllowance(true);
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
    const checkAllowanceStatus = async () => {
      if (!isEVMChain || !revertParams || !sourceChain) {
        return;
      }

      setIsCheckingAllowance(true);
      try {
        const result = await checkAllowance();
        if (result.ok && 'value' in result) {
          setHasAllowance(result.value);
        } else {
          console.error('Error checking allowance:', result.error);
          setHasAllowance(false);
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
        setHasAllowance(false);
      } finally {
        setIsCheckingAllowance(false);
      }
    };

    checkAllowanceStatus();
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
    setHasAllowance,
    sourceSpokeProvider,
  };
};
