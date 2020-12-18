import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Text } from 'rebass/styled-components';

import { DefaultLayout } from 'app/components/Layout';

export function TradePage() {
  return (
    <DefaultLayout>
      <Helmet>
        <title>Trade</title>
      </Helmet>

      <Text color="text" fontSize={35} fontWeight="bold">
        Trade Page
      </Text>
    </DefaultLayout>
  );
}
