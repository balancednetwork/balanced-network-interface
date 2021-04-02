import React from 'react';

import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';

type NotificationProps = {
  closeToast?: Function;
  summary?: string;
  failureReason?: string;
};

const NotificationPending = ({ summary }: NotificationProps) => {
  return (
    <NotificationContainer>
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

const NotificationContainer = styled(Flex)``;

const TransactionInfo = styled(Flex)``;

const TransactionInfoBody = styled.div``;

export { NotificationPending, NotificationSuccess, NotificationError };
