import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Text, Flex } from 'rebass/styled-components';

import { ButtonBase, TextButton } from 'app/components/Button';
import { Link } from 'app/components/Link';
import { Panel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="A Boilerplate application homepage" />
      </Helmet>
      <span>HomePage container</span>

      <Text color="text" fontSize={35}>
        Heading 1
      </Text>
      <Text color="text" fontSize={25}>
        Heading 2
      </Text>
      <Text color="text" fontSize={20}>
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

      <ButtonBase>Hello World</ButtonBase>
      <ButtonBase disabled>Hello World</ButtonBase>
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
