import React from 'react';

import { Trans } from '@lingui/macro';
import { useNavigate } from 'react-router-dom';

import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import ExternalIcon from '@/assets/icons/external.svg';
import FailureIcon from '@/assets/icons/failure.svg';
import PendingIcon from '@/assets/icons/pending.svg';
import SuccessIcon from '@/assets/icons/success.svg';

type NotificationProps = {
  closeToast?: Function;
  summary?: string;
  failureReason?: string;
  redirectOnSuccess?: string;
  generic?: boolean;
  title?: string;
};

const NotificationPending = ({ summary }: NotificationProps) => {
  return (
    <NotificationContainer>
      <TransactionStatus>
        <PendingIcon width={20} height={20} />
      </TransactionStatus>

      <TransactionInfo>
        <span className="font-[500]">{summary}</span>
      </TransactionInfo>
    </NotificationContainer>
  );
};

const NotificationSuccess = ({ summary, redirectOnSuccess }: NotificationProps) => {
  const navigate = useNavigate();
  redirectOnSuccess && navigate(redirectOnSuccess);

  return (
    <NotificationContainer>
      <TransactionStatus>
        <SuccessIcon width={20} height={20} />
      </TransactionStatus>
      <TransactionInfo>
        <span className="font-[500]">{summary}</span>
      </TransactionInfo>
    </NotificationContainer>
  );
};

const NotificationError = ({ failureReason, generic, title }: NotificationProps) => {
  const arbitraryCallsTestExecutionPassed = failureReason && failureReason.indexOf('everted(20)') >= 0;
  return (
    <NotificationContainer
      onClick={() => {
        if (generic) window.open('https://docs.balanced.network/troubleshooting#transaction-error', '_blank');
      }}
    >
      <TransactionStatus>
        {arbitraryCallsTestExecutionPassed ? (
          <SuccessIcon width={20} height={20} />
        ) : (
          <FailureIcon width={20} height={20} />
        )}
      </TransactionStatus>

      <TransactionInfo flexDirection="column">
        <TransactionInfoBody>
          <span className="font-[500]">
            {title ? (
              <Trans>{title}</Trans>
            ) : arbitraryCallsTestExecutionPassed ? (
              <Trans>Contract calls verified.</Trans>
            ) : (
              <Trans>Couldn't complete your transaction.</Trans>
            )}
          </span>
        </TransactionInfoBody>
        <TransactionInfoBody>
          <span className="font-[500]" color={generic ? 'primaryBright' : 'alert'}>
            {failureReason && !arbitraryCallsTestExecutionPassed && failureReason}
            {generic && <ExternalIcon width="15" height="15" style={{ marginLeft: 7, marginTop: -3 }} />}
          </span>
        </TransactionInfoBody>
      </TransactionInfo>
    </NotificationContainer>
  );
};

const NotificationContainer = styled(Flex)`
  align-items: flex-start;
`;

const TransactionStatus = styled.div`
  margin-top: -3px;
  margin-right: 6px;
`;

const TransactionInfo = styled(Flex)``;

const TransactionInfoBody = styled.div``;

export { NotificationPending, NotificationSuccess, NotificationError };
