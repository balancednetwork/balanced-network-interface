import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { useQuery, UseQueryResult } from 'react-query';

import { useICX } from 'constants/tokens';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';

import { AUTO_EXECUTION_ON_ICON } from './_icon/config';
import { AUTO_EXECUTION_ON_ARCHWAY } from './archway/config';
import { useARCH } from './archway/tokens';
import { SupportedXCallChains } from './types';
import { useArchwayXcallFee } from './archway/eventHandler';
import { useIconXcallFee } from './_icon/eventHandlers';

const ARCHWAY_GAS_THRESHOLD = 5;
const ICX_GAS_THRESHOLD = 4;

export function useXCallGasChecker(
  chain1: SupportedXCallChains,
  chain2: SupportedXCallChains,
  icon: boolean = false,
): UseQueryResult<{ hasEnoughGas: boolean; errorMessage: string }> {
  const wallets = useSignedInWallets();
  const balances = useCrossChainWalletBalances();
  const ARCH = useARCH();
  const ICX = useICX();

  return useQuery<{ hasEnoughGas: boolean; errorMessage: string }>(
    ['gasChecker', chain1, chain2, icon, wallets, balances],
    async () => {
      let errorMessage = '';
      const hasEnoughGasAllArray: boolean[] = [];

      if (chain1 === 'archway' || chain2 === 'archway') {
        const gasAmount = balances['archway'] && balances['archway'][ARCH.address];
        const hasEnoughGas =
          AUTO_EXECUTION_ON_ARCHWAY ||
          (gasAmount
            ? !CurrencyAmount.fromRawAmount(ARCH, ARCHWAY_GAS_THRESHOLD * 10 ** ARCH.decimals).greaterThan(gasAmount)
            : false);
        if (!hasEnoughGas) {
          errorMessage = `You need at least ${ARCHWAY_GAS_THRESHOLD} ARCH to pay for transaction fees on Archway.`;
        }
        hasEnoughGasAllArray.push(hasEnoughGas);
      }

      if (icon || chain1 === 'icon' || chain2 === 'icon') {
        const gasAmount = balances['icon'] && balances['icon'][ICX.address];
        const hasEnoughGas =
          AUTO_EXECUTION_ON_ICON ||
          (gasAmount
            ? !CurrencyAmount.fromRawAmount(ICX, ICX_GAS_THRESHOLD * 10 ** ICX.decimals).greaterThan(gasAmount)
            : false);
        if (!hasEnoughGas) {
          errorMessage = `You need at least ${ICX_GAS_THRESHOLD} ICX to pay for transaction fees on ICON.`;
        }
        hasEnoughGasAllArray.push(hasEnoughGas);
      }

      const hasEnoughGas = !hasEnoughGasAllArray.some(hasEnough => !hasEnough);

      return { hasEnoughGas, errorMessage };
    },
    {
      keepPreviousData: true,
      refetchInterval: 3000,
    },
  );
}

// TODO: improve this hook
export const useXcallFee = (chain: string) => {
  const ARCH = useARCH();
  const { data: archwayXcallFees } = useArchwayXcallFee();
  const { data: iconXcallFees } = useIconXcallFee();

  let xcallFee: any;
  let formattedXcallFee: any;

  switch (chain) {
    case 'archway':
      xcallFee = archwayXcallFees;
      formattedXcallFee = (Number(xcallFee?.rollback) / 10 ** ARCH.decimals).toPrecision(3) + ' ARCH';
      break;
    case 'icon':
      xcallFee = iconXcallFees;
      formattedXcallFee = (parseInt(xcallFee?.rollback, 16) / 10 ** 18).toPrecision(3) + ' ICX';
      break;
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }

  return { xcallFee, formattedXcallFee };
};
