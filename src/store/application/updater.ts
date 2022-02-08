import { useCallback, useEffect, useState } from 'react';

import Block from 'icon-sdk-js/build/data/Formatter/Block';
import { useIconReact } from 'packages/icon-react';

import useDebounce from 'hooks/useDebounce';
import useInterval from 'hooks/useInterval';
import useIsWindowVisible from 'hooks/useIsWindowVisible';
import { useAppDispatch } from 'store/hooks';

import { updateBlockNumber, updateChainId } from './reducer';

export default function Updater(): null {
  const { networkId: chainId, iconService } = useIconReact();
  const dispatch = useAppDispatch();
  const windowVisible = useIsWindowVisible();

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null,
  });

  const blockNumberCallback = useCallback(
    (block: Block) => {
      setState(state => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber: block.height };
          return { chainId, blockNumber: Math.max(block.height, state.blockNumber) };
        }
        return state;
      });
    },
    [chainId, setState],
  );

  //call useEffect per 4000ms
  const [last, setLast] = useState(0);
  const increment = useCallback(() => setLast(last => last + 1), [setLast]);
  useInterval(increment, 4000);

  // attach/detach listeners
  useEffect(() => {
    if (!iconService || !chainId || !windowVisible) return undefined;

    setState({ chainId, blockNumber: null });

    iconService
      .getLastBlock()
      .execute()
      .then(blockNumberCallback)
      .catch(error => console.error(`Failed to get block number for chainId: ${chainId}`, error));
  }, [dispatch, chainId, iconService, blockNumberCallback, windowVisible, last]);

  const debouncedState = useDebounce(state, 100);

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !windowVisible) return;
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }));
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId]);

  useEffect(() => {
    dispatch(updateChainId({ chainId: debouncedState.chainId }));
  }, [dispatch, debouncedState.chainId]);

  return null;
}
