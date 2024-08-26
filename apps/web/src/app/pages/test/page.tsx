import React from 'react';
import { Flex } from 'rebass/styled-components';

export function TestPage() {
  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
