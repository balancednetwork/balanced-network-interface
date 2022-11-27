import React from 'react';

import { toast, ToastOptions, UpdateOptions } from 'react-toastify';

import {
  NotificationPending,
  NotificationError,
  NotificationSuccess,
} from 'app/components/Notification/TransactionNotification';
import { TransactionStatus } from 'store/transactions/hooks';

interface ToastTransactionParams {
  message: string;
  transactionStatus?: TransactionStatus;
  options?: UpdateOptions | ToastOptions;
  id: string;
}

export const openToast = ({
  message,
  transactionStatus = TransactionStatus.pending,
  options = {},
  id,
}: ToastTransactionParams) => {
  switch (transactionStatus) {
    case TransactionStatus.success: {
      toast.update(id, {
        render: <NotificationSuccess summary={message} />,
        autoClose: 3000,
        ...options,
      });
      break;
    }
    case TransactionStatus.failure: {
      toast.update(id, {
        render: <NotificationError summary={message} />,
        autoClose: 5000,
        ...options,
      });
      break;
    }
    default: {
      toast(<NotificationPending summary={message} />, {
        toastId: id === '' ? undefined : id,
        ...(options as ToastOptions),
      });
    }
  }
};
