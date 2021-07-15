import React from 'react';

import { DefaultLayout } from 'app/components/Layout';
import { Pagemeta } from 'app/components/Pagemeta';

export function VotePage() {
  return (
    <DefaultLayout title="Vote">
      <Pagemeta title="Vote" />
    </DefaultLayout>
  );
}
