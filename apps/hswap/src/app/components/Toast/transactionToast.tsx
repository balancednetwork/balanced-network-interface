import React from 'react';

import { t } from '@lingui/macro';
import { toast, ToastOptions, UpdateOptions } from 'react-toastify';

import {
  NotificationPending,
  NotificationError,
  NotificationSuccess,
} from '@/app/components/Notification/TransactionNotification';
import { TransactionStatus } from '@/store/transactions/hooks';

export interface ToastTransactionParams {
  title?: string;
  message: string;
  transactionStatus?: TransactionStatus;
  options?: UpdateOptions | ToastOptions;
  id?: string;
}

export const openToast = ({
  title,
  message,
  transactionStatus = TransactionStatus.pending,
  options = {},
  id,
}: ToastTransactionParams) => {
  switch (transactionStatus) {
    case TransactionStatus.success: {
      if (id) {
        toast.update(id, {
          render: <NotificationSuccess title={title} summary={message} />,
          autoClose: 5000,
          ...options,
        });
      } else {
        toast(<NotificationSuccess title={title} summary={message} />, {
          autoClose: 5000,
          ...(options as ToastOptions),
        });
      }
      break;
    }
    case TransactionStatus.failure: {
      if (id) {
        toast.update(id, {
          render: <NotificationError summary={message} title={title} />,
          autoClose: 5000,
          ...options,
        });
      } else {
        toast(
          <NotificationError
            title={title}
            failureReason={message || t`Learn how to resolve common transaction errors.`}
            generic={true}
          />,
          {
            toastId: 'genericError',
            autoClose: 5000,
          },
        );
      }

      break;
    }
    default: {
      toast(<NotificationPending title={title} summary={message} />, {
        toastId: id,
        ...(options as ToastOptions),
      });
    }
  }
};
