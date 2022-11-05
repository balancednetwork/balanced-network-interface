import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { usePrevious } from 'react-use';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as CrossIcon } from 'assets/icons/failure.svg';
import { ReactComponent as TickIcon } from 'assets/icons/tick.svg';
import { useShouldLedgerSign } from 'store/application/hooks';

import ModalContent from '../ModalContent';
import Spinner from '../Spinner';

const CancelButton = styled(Button)`
  flex-grow: 1;
  max-height: 33px;
  max-width: 145px;
  font-size: 14px;
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
  max-width: 145px;
  font-size: 14px;
`;

export enum ModalStatus {
  'None' = 'None',
  'Approve' = 'Approve',
  'Reject' = 'Reject',
  'ChangeToApprove' = 'ChangeToApprove',
  'ChangeToReject' = 'ChangeToReject',
}

interface ProposalProps {
  status: ModalStatus;
  onCancel: () => void;
  onSubmit: () => void;
  weight: BigNumber | undefined;
}

export function ProposalModal(props: ProposalProps) {
  const { status, onCancel, onSubmit, weight } = props;
  const isOpen = status !== ModalStatus.None;

  const shouldLedgerSign = useShouldLedgerSign();

  // the code prevents flicking while this modal is closing.
  const prevStatus = usePrevious(status);
  const UIStatus = status === ModalStatus.None ? prevStatus : status;

  return (
    <Modal isOpen={isOpen} onDismiss={onCancel}>
      <ModalContent noCurrencyBalanceErrorMessage>
        <Typography variant="content" textAlign="center" mb={1}>
          {UIStatus === ModalStatus.ChangeToApprove || UIStatus === ModalStatus.ChangeToReject
            ? t`Change vote?`
            : t`Submit vote?`}
        </Typography>
        {(UIStatus === ModalStatus.Reject || UIStatus === ModalStatus.ChangeToReject) && (
          <>
            <CrossIcon
              width="35px"
              height="35px"
              style={{ margin: 'auto', display: 'block', marginTop: '5px', marginBottom: '5px' }}
            />
            <Typography variant="h3" textAlign="center" mb={3}>
              <Trans>Reject</Trans>
            </Typography>
          </>
        )}
        {(UIStatus === ModalStatus.Approve || UIStatus === ModalStatus.ChangeToApprove) && (
          <>
            <TickIcon
              width="35px"
              height="35px"
              style={{ margin: 'auto', display: 'block', marginTop: '5px', marginBottom: '5px' }}
            />
            <Typography variant="h3" textAlign="center" mb={3}>
              <Trans>Approve</Trans>
            </Typography>
          </>
        )}
        <Typography variant="content" textAlign="center" mb={3}>
          <Trans>Voting weight</Trans>: {weight?.dp(2).toFormat()} bBALN
        </Typography>
        <Divider mb={5} />
        <Flex flexDirection="row" width="100%" justifyContent="center">
          {shouldLedgerSign && <Spinner />}
          {!shouldLedgerSign && (
            <>
              <CancelButton onClick={onCancel}>
                <Trans>Cancel</Trans>
              </CancelButton>
              <SubmitButton onClick={onSubmit}>
                {UIStatus === ModalStatus.ChangeToApprove || UIStatus === ModalStatus.ChangeToReject
                  ? t`Change vote`
                  : t`Submit vote`}
              </SubmitButton>
            </>
          )}
        </Flex>
      </ModalContent>
    </Modal>
  );
}
