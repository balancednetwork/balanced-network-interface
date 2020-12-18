import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Text } from 'rebass/styled-components';

import { DefaultLayout } from 'app/components/Layout';

export function VotePage() {
  return (
    <DefaultLayout>
      <Helmet>
        <title>Vote</title>
      </Helmet>

      <Text color="text" fontSize={35} fontWeight="bold">
        Vote Page
      </Text>
    </DefaultLayout>
  );
}
