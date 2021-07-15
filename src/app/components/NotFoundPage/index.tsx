import * as React from 'react';

import styled from 'styled-components/macro';

import { Pagemeta } from '../Pagemeta';
import { P } from './P';

export function NotFoundPage() {
  return (
    <>
      <Pagemeta title="404 Page Not Found" description="Page not found" />
      <Wrapper>
        <Title>
          4
          <span role="img" aria-label="Crying Face">
            😢
          </span>
          4
        </Title>
        <P>Page not found.</P>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 320px;
`;

const Title = styled.div`
  margin-top: -8vh;
  font-weight: bold;
  color: black;
  font-size: 3.375rem;

  span {
    font-size: 3.125rem;
  }
`;
