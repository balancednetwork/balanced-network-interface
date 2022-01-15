import { useEffect, useState } from 'react';

import useKeyPress from './useKeyPress';

export default function useArrowControlControl(
  active: boolean,
  count: number,
): { activeIndex: number; setActiveIndex: React.Dispatch<React.SetStateAction<number>> } {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const arrowDown = useKeyPress('ArrowDown', true);
  const arrowUp = useKeyPress('ArrowUp', true);

  //arrow down
  useEffect(() => {
    if (active && count && arrowDown) {
      setActiveIndex(prevState => (prevState < count - 1 ? prevState + 1 : prevState));
    }
  }, [active, arrowDown, count]);

  //arrow up
  useEffect(() => {
    if (active && count && arrowUp) {
      setActiveIndex(prevState => (prevState > 0 ? prevState - 1 : prevState));
    }
  }, [active, arrowUp, count]);

  //update index to stay in range after item count changes
  useEffect(() => {
    if (active && activeIndex >= count) {
      setActiveIndex(Math.max(count - 1, 0));
    }
  }, [active, activeIndex, count]);

  return {
    activeIndex: activeIndex,
    setActiveIndex: setActiveIndex,
  };
}
