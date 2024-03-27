import { useCallback } from 'react';

import { getService } from '../services/transfer';
import { useBTPSelector } from '../store';
import { accountSelector } from '../store/models/account';

function useGetBTPService() {
  const { accountInfo } = useBTPSelector(accountSelector);
  const getBTPService = useCallback(() => {
    if (accountInfo !== null) {
      return getService(accountInfo);
    }
  }, [accountInfo]);

  return getBTPService;
}

export { useGetBTPService };
