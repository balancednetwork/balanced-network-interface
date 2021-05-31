import React from 'react';

import { BoxPanel } from 'app/components/Panel';

import SendPanel from './SendPanel';

export default function BnUSDWallet() {
  return (
    <BoxPanel bg="bg3">
      <SendPanel currencyKey="bnUSD" />
    </BoxPanel>
  );
}
