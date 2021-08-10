import React from 'react';

import { Helmet } from 'react-helmet-async';

import { DefaultLayout } from 'app/components/Layout';

export function VotePage() {
  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
    </DefaultLayout>
  );
}
