import { useEffect } from 'react';

import { SUCCESS_TRANSACTION } from 'btp/src/utils/constants';

export function useListenForSuccessTransaction(callback) {
  useEffect(() => {
    const handler = () => {
      if (callback) callback();
    };
    document.addEventListener(SUCCESS_TRANSACTION, handler, false);

    return () => {
      document.removeEventListener(SUCCESS_TRANSACTION, handler, false);
    };
  }, [callback]);
}
