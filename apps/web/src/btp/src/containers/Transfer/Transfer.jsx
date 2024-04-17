import React from 'react';

import { TransferBox } from 'btp/src/components/TransferBox';

import { BoxPanel } from 'app/components/Panel';

const Transfer = () => {
  return (
    <BoxPanel bg="bg2" mt={25} mb={100}>
      <TransferBox />
    </BoxPanel>
  );
};

export default Transfer;
