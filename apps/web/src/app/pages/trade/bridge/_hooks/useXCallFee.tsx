import { useQuery } from '@tanstack/react-query';
import { IXCallFee, XChainId, XChainType } from '../types';
import { useArchwayContext } from '../../../../_xcall/archway/ArchwayProvider';
import bnJs from 'bnJs';
import { archway, xChainMap } from '../_config/xChains';
import { usePublicClient } from 'wagmi';
import { useMemo } from 'react';
import { ArchwayClient } from '@archwayhq/arch3.js/build';
import { BalancedJs } from '@balancednetwork/balanced-js';
import { formatEther, getContract, PublicClient } from 'viem';
import { xCallContractAbi } from 'app/pages/trade/bridge/_xcall/abis/xCallContractAbi';

const fetchFee = async (
  from: XChainId,
  to: XChainId,
  rollback: boolean,
  client: ArchwayClient | BalancedJs | PublicClient,
): Promise<bigint> => {
  const xChain = xChainMap[from];
  const xChainType = xChainMap[from].xChainType;
  const nId: XChainId = from === '0x1.icon' ? to : '0x1.icon';

  if (xChainType === 'ICON') {
    const res = await (client as BalancedJs).XCall.getFee(nId, rollback);
    return BigInt(res);
  }

  if (xChainType === 'ARCHWAY') {
    const res = await (client as ArchwayClient)?.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: nId, rollback: rollback },
    });
    return BigInt(res);
  }

  if (xChainType === 'EVM') {
    const contract = getContract({
      abi: xCallContractAbi,
      address: xChain.contracts.xCall as `0x${string}`,
      client: client as PublicClient,
    });
    return contract.read.getProtocolFee();
  }

  return 0n;
};

// TODO: improve this hook
const useXCallFee = (from: XChainId, to: XChainId): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const { client } = useArchwayContext();
  const publicClient = usePublicClient();

  const publicClientMap: { [key in XChainType]?: PublicClient | ArchwayClient | BalancedJs } = useMemo(
    () => ({
      ICON: bnJs,
      ARCHWAY: client,
      EVM: publicClient,
    }),
    [publicClient, client],
  );

  const xChainType = xChainMap[from].xChainType;
  const pClient = publicClientMap[xChainType];

  const query = useQuery({
    queryKey: [`xcall-fees`, from, to, pClient],
    queryFn: async () => {
      if (!pClient) return;

      const feeWithRollback = await fetchFee(from, to, true, pClient);
      const feeNoRollback = await fetchFee(from, to, false, pClient);

      return {
        noRollback: feeNoRollback,
        rollback: feeWithRollback,
      };
    },
    enabled: !!pClient,
  });

  const { data: xCallFee } = query;

  const chain = xChainMap[from];

  const formattedXCallFee: string = xCallFee ? formatEther(xCallFee.rollback) + ' ' + chain.nativeCurrency.symbol : '';

  return { xCallFee, formattedXCallFee };
};

export default useXCallFee;
