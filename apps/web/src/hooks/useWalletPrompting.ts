import { useCallback, useRef, useState } from 'react';

export const useWalletPrompting = () => {
  const [isWalletPrompting, setIsWalletPrompting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setWalletPrompting = useCallback((value: boolean) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    setIsWalletPrompting(value);

    if (value) {
      timeoutRef.current = setTimeout(() => {
        setIsWalletPrompting(false);
        timeoutRef.current = undefined;
      }, 30000);
    }
  }, []);

  return {
    isWalletPrompting,
    setWalletPrompting,
  };
};
