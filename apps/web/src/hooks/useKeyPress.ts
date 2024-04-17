import { useState, useEffect } from 'react';

// taken from https://usehooks.com/useKeyPress/
export default function useKeyPress(targetKey: string, preventDefault?: boolean) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState<boolean>(false);
  // If pressed key is our target key then set to true
  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }
  // If released key is our target key then set to false
  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  };
  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    preventDefault &&
      window.addEventListener('keydown', e => {
        if (e.key === targetKey) {
          e.preventDefault();
        }
      });
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
    // eslint-disable-next-line
  }, []); // Empty array ensures that effect is only run on mount and unmount
  return keyPressed;
}
