import React from 'react';

import { Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

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
      <TransactionInfo>
        <TransactionInfoBody>failed</TransactionInfoBody>
        <TransactionInfoBody isFailureMessage={true}>
          <Typography variant="p" fontWeight={500}>
            {failureReason}
          </Typography>
        </TransactionInfoBody>
      </TransactionInfo>
    </NotificationContainer>
  );
};

const NotificationContainer = styled(Flex)``;

const TransactionInfo = styled(Flex)``;
const TransactionInfoBody = styled.div<{ isFailureMessage?: boolean }>`
  ${props =>
    props.isFailureMessage &&
    css`
      color: ${props => props.theme.colors.bg3};
    `}
`;

export { NotificationPending, NotificationSuccess, NotificationError };
