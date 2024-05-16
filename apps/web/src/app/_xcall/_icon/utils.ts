import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import IconService, { BigNumber } from 'icon-sdk-js';

import { NETWORK_ID } from 'constants/config';

import { ICONBlockType, ICONTxResultType } from './types';

export const httpProvider = new IconService.HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint);
export const iconService = new IconService(httpProvider);

async function sleep(time) {
  await new Promise(resolve => {
    setTimeout(resolve, time);
  });
}

export async function fetchTxResult(hash: string): Promise<ICONTxResultType | undefined> {
  for (let i = 0; i < 10; i++) {
    try {
      const txResult = await iconService.getTransactionResult(hash).execute();
      return txResult as ICONTxResultType;
    } catch (e) {
      console.log(`xCall debug - icon tx result (pass ${i}):`, e);
    }
    await sleep(1000);
  }
}

export async function getBlock(height: string): Promise<ICONBlockType | undefined> {
  const heightNumber = new BigNumber(height, 16).minus(1);
  for (let i = 0; i < 10; i++) {
    try {
      const block = await iconService.getBlockByHeight(heightNumber).execute();
      return block as ICONBlockType;
    } catch (e) {
      console.log(`xCall debug - icon tx result (pass ${i}):`, e);
    }
    await sleep(1000);
  }
}
