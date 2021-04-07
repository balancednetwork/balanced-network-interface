import React from 'react';

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

const NotificationSuccess = ({ summary }: NotificationProps) => {
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

const NotificationError = ({ failureReason }: NotificationProps) => {
  return (
    <NotificationContainer>
      <TransactionStatus>
        <FailureIcon width={20} height={20} />
      </TransactionStatus>

      <TransactionInfo flexDirection="column">
        <TransactionInfoBody>
          <Typography variant="p" fontWeight={500}>
            Your transaction has failed.
          </Typography>
        </TransactionInfoBody>
        <TransactionInfoBody>
          <Typography variant="p" fontWeight={500} color="alert">
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
