import { useEffect, useState } from 'react';

import useKeyPress from './useKeyPress';

export default function useArrowControl(
  active: boolean,
  count: number,
  initialIndex?: number,
): { activeIndex: number | undefined; setActiveIndex: React.Dispatch<React.SetStateAction<number | undefined>> } {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(initialIndex);
  const arrowDown = useKeyPress('ArrowDown', true);
  const arrowUp = useKeyPress('ArrowUp', true);

  //arrow down
  useEffect(() => {
    if (active && count && arrowDown) {
      setActiveIndex(prevState => (prevState !== undefined ? (prevState < count - 1 ? prevState + 1 : prevState) : 0));
    }
  }, [active, arrowDown, count]);

  //arrow up
  useEffect(() => {
    if (active && count && arrowUp) {
      setActiveIndex(prevState => (prevState !== undefined ? (prevState > 0 ? prevState - 1 : prevState) : count - 1));
    }
  }, [active, arrowUp, count]);

  //update index to stay in range after item count changes
  useEffect(() => {
    if (active && activeIndex !== undefined && activeIndex >= count) {
      setActiveIndex(Math.max(count - 1, 0));
    }
  }, [active, activeIndex, count]);

  return {
    activeIndex: activeIndex,
    setActiveIndex: setActiveIndex,
  };
}
