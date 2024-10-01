import { Converter as IconConverter } from 'icon-sdk-js';

import { useXAccount, useXService } from '@/xwagmi/hooks';
import { IconXService } from '@/xwagmi/xchains/icon';

export const GOVERNANCE_BASE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const API_VERSION = IconConverter.toBigNumber(3);

export function useIconReact() {
  const iconXService: IconXService = useXService('ICON') as IconXService;
  const iconXAccount = useXAccount('ICON');

  return {
    account: iconXAccount.address,
    iconService: iconXService.iconService,
  };
}
