import { useDispatch as useReduxDispatch, useSelector, useStore } from 'react-redux';

const useDispatch = selector => {
  const dispatch = useReduxDispatch();
  return selector(dispatch);
};

const useSelect = mapSelectors => {
  const { select } = useStore();
  return useSelector(select(mapSelectors));
};

export { useDispatch, useSelector, useSelect };
