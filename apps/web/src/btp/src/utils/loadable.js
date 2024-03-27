import React, { lazy, Suspense } from 'react';

const loadable = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);

  // eslint-disable-next-line react/display-name
  return props => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default loadable;
