import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Text, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import { Link } from 'app/components/Link';
import { Panel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';

export function StyleGuidePage() {
  return (
    <>
      <Helmet>
        <title>Style Guide Page</title>
        <meta name="description" content="Balanced Network Interface Style Guide" />
      </Helmet>

      <Text color="text" fontSize={35} fontWeight="bold">
        Style Guide
      </Text>

      <Text color="text" fontSize={35} fontWeight="bold">
        Heading 1
      </Text>

      <Text color="text" fontSize={25} fontWeight="bold">
        Heading 2
      </Text>

      <Text color="text" fontSize={20} fontWeight="bold">
        Heading 3
      </Text>

      <Text color="text" fontSize={16}>
        This is a paragraph of text.
      </Text>

      <Text color="text" fontSize={14}>
        This is a label.
      </Text>

      <Link href="#">This is a link</Link>
      <br />
      <br />

      <Flex>
        <Text color="text" fontSize={14}>
          This is a tooltip.
        </Text>
        <QuestionHelper text={"Use this tool to find pairs that don't automatically appear in the interface."} />
      </Flex>

      <Button>Hello World</Button>
      <Button disabled>Hello World</Button>
      <TextButton>Cancel</TextButton>

      <Panel bg="bg2">
        <Text color="text">This is a panel</Text>
      </Panel>

      <Panel bg="bg3">
        <Text color="text">This is a panel</Text>
      </Panel>
    </>
  );
}
