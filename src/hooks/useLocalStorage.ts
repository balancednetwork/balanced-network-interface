import { useCallback, useState } from 'react';

// Taken from https://usehooks.com/useLocalStorage/
export default function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue],
  );
  return [storedValue, setValue] as const;
}

export function useLocalStorageWithExpiry<T>(key: string, initialValue: T, expireIn: number) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const itemString = window.localStorage.getItem(key);
      if (!itemString) {
        return initialValue;
      }
      const item = JSON.parse(itemString);
      const now = new Date();
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return initialValue;
      }
      return item.value || initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        const now = new Date();
        const item = {
          value: valueToStore,
          expiry: now.getTime() + expireIn,
        };
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.log(error);
      }
    },
    [key, storedValue, expireIn],
  );
  return [storedValue, setValue] as const;
}
