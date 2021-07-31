import React from 'react';

import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as CrossIcon } from 'assets/icons/failure.svg';
import { ReactComponent as TickIcon } from 'assets/icons/tick.svg';

interface ProposalProps {
  isOpen: boolean;
  toggleOpen: Function;
  balnWeight: number | undefined;
  type: 'Approve' | 'Reject';
}

const CancelButton = styled(Button)`
  flex-grow: 1;
  max-height: 33px;
  max-width: 130px;
  font-size: 13px;
  background-color: inherit;
  color: ${({ theme }) => theme.colors.text1};
  &:hover {
    background-color: transparent;
    color: white;
    transition: background-color 0.2s ease;
  }
`;

const SubmitButton = styled(Button)`
  flex-grow: 1;
  max-height: 33px;
  max-width: 130px;
  font-size: 13px;
`;

export function ProposalModal(props: ProposalProps) {
  const { isOpen, toggleOpen, balnWeight, type } = props;
  return (
    <Modal isOpen={isOpen} onDismiss={() => toggleOpen(!isOpen)}>
      <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
        <Typography variant="content" textAlign="center" mb={1}>
          Submit vote?
        </Typography>
        {type === 'Reject' ? (
          <>
            <CrossIcon
              width="35px"
              height="35px"
              style={{ margin: 'auto', display: 'block', marginTop: '5px', marginBottom: '5px' }}
            />
            <Typography variant="h3" textAlign="center" mb={3}>
              Reject
            </Typography>
          </>
        ) : (
          <>
            <TickIcon
              width="35px"
              height="35px"
              style={{ margin: 'auto', display: 'block', marginTop: '5px', marginBottom: '5px' }}
            />
            <Typography variant="h3" textAlign="center" mb={3}>
              Approve
            </Typography>
          </>
        )}
        <Typography variant="content" textAlign="center" mb={3}>
          {/* Automatically format the number to put a comma every 3 zeros */}
          {balnWeight === undefined ? '' : `Voting Weight: ${balnWeight.toLocaleString()} BALN`}
        </Typography>
        <Divider mb={5} />
        <Flex flexDirection="row" width="100%" justifyContent="center">
          <CancelButton onClick={() => toggleOpen(!isOpen)}>Cancel</CancelButton>
          <SubmitButton onClick={() => toggleOpen(!isOpen)}>Submit Vote</SubmitButton>
        </Flex>
      </Flex>
    </Modal>
  );
}
