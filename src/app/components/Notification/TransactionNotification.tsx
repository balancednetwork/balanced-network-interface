import React from 'react';

import { Trans } from '@lingui/macro';
import { useHistory } from 'react-router-dom';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';
import { ReactComponent as FailureIcon } from 'assets/icons/failure.svg';
import { ReactComponent as PendingIcon } from 'assets/icons/pending.svg';
import { ReactComponent as SuccessIcon } from 'assets/icons/success.svg';

type NotificationProps = {
  closeToast?: Function;
  summary?: string;
  failureReason?: string;
  redirectOnSuccess?: string;
  generic?: boolean;
};

const NotificationPending = ({ summary }: NotificationProps) => {
  return (
    <NotificationContainer>
      <TransactionStatus>
        <PendingIcon width={20} height={20} />
      </TransactionStatus>

      <TransactionInfo>
        <Typography variant="p" fontWeight={500}>
          {summary}
        </Typography>
      </TransactionInfo>
    </NotificationContainer>
  );
};

const NotificationSuccess = ({ summary, redirectOnSuccess }: NotificationProps) => {
  const history = useHistory();
  redirectOnSuccess && history.push(redirectOnSuccess);

  return (
    <NotificationContainer>
      <TransactionStatus>
        <SuccessIcon width={20} height={20} />
      </TransactionStatus>
      <TransactionInfo>
        <Typography variant="p" fontWeight={500}>
          {summary}
        </Typography>
      </TransactionInfo>
    </NotificationContainer>
  );
};

const NotificationError = ({ failureReason, generic }: NotificationProps) => {
  return (
    <NotificationContainer
      onClick={() => {
        if (generic) window.open('https://docs.balanced.network/troubleshooting#transaction-error', '_blank');
      }}
    >
      <TransactionStatus>
        <FailureIcon width={20} height={20} />
      </TransactionStatus>

      <TransactionInfo flexDirection="column">
        <TransactionInfoBody>
          <Typography variant="p" fontWeight={500}>
            <Trans>Couldn't complete your transaction.</Trans>
          </Typography>
        </TransactionInfoBody>
        <TransactionInfoBody>
          <Typography variant="p" fontWeight={500} color={generic ? 'primaryBright' : 'alert'}>
            {failureReason}
          </Typography>
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
