import { useCallback, useState } from 'react';

export const useWalletPrompting = () => {
  const [isWalletPrompting, setIsWalletPrompting] = useState(false);

  const setWalletPrompting = useCallback((value: boolean) => {
    setIsWalletPrompting(value);
    if (value) {
      setTimeout(() => {
        setIsWalletPrompting(false);
      }, 10000);
    }
  }, []);

  return {
    isWalletPrompting,
    setWalletPrompting,
  };
};
