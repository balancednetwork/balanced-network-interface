import { useEffect, useState } from 'react';

export default function useElapsedTime(timestamp: number | undefined): number {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (timestamp) {
      const updateElapsedTime = () => {
        setElapsedTime(Math.floor((Date.now() - timestamp) / 1000));
      };

      updateElapsedTime(); // Update immediately

      const interval = setInterval(
        () => {
          updateElapsedTime();
        },
        Date.now() - timestamp > 600000 ? 60000 : 1000,
      ); // 600000 ms = 10 minutes

      return () => clearInterval(interval);
    }
  }, [timestamp]);

  return elapsedTime;
}
