import { useEffect, useRef, useState } from 'react';

export default function useLastCount(value: number) {
  const intervalId = useRef<number>(-1);
  const [last, setLast] = useState<number>(0);

  useEffect(() => {
    intervalId.current = setInterval(() => setLast(last => last + 1), value);

    return () => {
      clearInterval(intervalId.current);
    };
  }, [value]);

  return last;
}
