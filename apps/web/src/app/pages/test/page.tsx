import React from 'react';

import { SectionPanel } from 'app/pages/trade/supply/_components/utils';
import { Flex } from 'rebass';

export function TestPage() {
  return (
    <SectionPanel bg="bg3" style={{ width: '100%' }} p={2}>
      <Flex justifyContent="space-between">test</Flex>
    </SectionPanel>
  );
}
