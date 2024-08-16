import { useState } from 'react';

const useBoolean = (defaultValue: boolean = false) => {
  const [state, setState] = useState(defaultValue);

  const on = () => setState(() => true);
  const off = () => setState(() => false);
  const toggle = () => setState(prev => !prev);

  return {
    state,
    on,
    off,
    toggle,
  };
};

export default useBoolean;
