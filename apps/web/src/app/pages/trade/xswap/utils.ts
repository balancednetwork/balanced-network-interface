import { intentService } from '@/lib/intent';
import { ChainName } from 'icon-intents-sdk';

const MAX_RETRY_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryGetOrder = async (
  intentHash: string,
  chainName: ChainName,
  provider: any,
  attempts = 0,
): Promise<{ ok: boolean; value?: any; error?: any }> => {
  try {
    const result = await intentService.getOrder(intentHash, chainName, provider);
    if (result?.ok) {
      return result;
    }

    if (attempts >= MAX_RETRY_ATTEMPTS) {
      return { ok: false, error: new Error('Max retry attempts reached') };
    }

    await sleep(RETRY_DELAY_MS);
    return retryGetOrder(intentHash, chainName, provider, attempts + 1);
  } catch (error) {
    if (attempts >= MAX_RETRY_ATTEMPTS) {
      return { ok: false, error };
    }
    await sleep(RETRY_DELAY_MS);
    return retryGetOrder(intentHash, chainName, provider, attempts + 1);
  }
};
