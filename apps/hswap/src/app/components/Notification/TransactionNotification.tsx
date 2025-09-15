import React from 'react';

import { Trans } from '@lingui/macro';
import { useNavigate } from 'react-router-dom';

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
    <div className="flex items-start">
      <div className="-mt-1 mr-2">
        <PendingIcon width={20} height={20} />
      </div>

      <div className="flex flex-col">
        <span className="font-[500]">{summary}</span>
      </div>
    </div>
  );
};

const NotificationSuccess = ({ summary, redirectOnSuccess }: NotificationProps) => {
  const navigate = useNavigate();
  redirectOnSuccess && navigate(redirectOnSuccess);

  return (
    <div className="flex items-start">
      <div className="-mt-1 mr-2">
        <SuccessIcon width={20} height={20} />
      </div>

      <div className="flex flex-col">
        <span className="font-[500]">{summary}</span>
      </div>
    </div>
  );
};

const NotificationError = ({ failureReason, generic, title }: NotificationProps) => {
  const arbitraryCallsTestExecutionPassed = failureReason && failureReason.indexOf('everted(20)') >= 0;
  return (
    <div
      className="flex items-start"
      onClick={() => {
        if (generic) window.open('https://docs.balanced.network/troubleshooting#transaction-error', '_blank');
      }}
    >
      <div className="-mt-1 mr-2">
        {arbitraryCallsTestExecutionPassed ? (
          <SuccessIcon width={20} height={20} />
        ) : (
          <FailureIcon width={20} height={20} />
        )}
      </div>

      <div className="flex flex-col">
        <div>
          <span className="font-[500]">
            {title ? (
              <Trans>{title}</Trans>
            ) : arbitraryCallsTestExecutionPassed ? (
              <Trans>Contract calls verified.</Trans>
            ) : (
              <Trans>Couldn't complete your transaction.</Trans>
            )}
          </span>
        </div>
        <div>
          <span className="font-[500]" color={generic ? 'primaryBright' : 'alert'}>
            {failureReason && !arbitraryCallsTestExecutionPassed && failureReason}
            {generic && <ExternalIcon width="15" height="15" style={{ marginLeft: 7, marginTop: -3 }} />}
          </span>
        </div>
      </div>
    </div>
  );
};

export { NotificationPending, NotificationSuccess, NotificationError };
