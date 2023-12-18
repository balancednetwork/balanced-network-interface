import { t } from '@lingui/macro';
import { checkIRC2Token } from 'btp/src/connectors/chainConfigs';
import { CHAIN_NAME } from 'btp/src/connectors/chainCustomization';

import { TransactionStatus } from 'store/transactions/hooks';

import { EVENTS, trigger } from '../../../utils/customEvent';
import { AccountState, setAccountInfo } from '../store/models/account';
import { SIGNING_ACTIONS } from './constants';

export const triggerSetAccountInfo = (accountInfo: AccountState | null) => {
  if (accountInfo !== null) {
    trigger(EVENTS.DISPATCH, { action: setAccountInfo(accountInfo) });
  }
  window['accountInfo'] = { ...window['accountInfo'], ...accountInfo };
};

export const triggerApproveEvent = (status: TransactionStatus, txHash?: string) => {
  trigger(EVENTS.APPROVE, { txHash, status });
};

export const triggerTransferEvent = (status: TransactionStatus, txHash?: string) => {
  trigger(EVENTS.APPROVE, { txHash, status });
};

export const getTransactionMessages = (
  transactionInfo: any,
  action,
): {
  [key in TransactionStatus]: string;
} => {
  const defaultMessages = {
    pending: t`Processing transaction...`,
    success: t`Your transaction has successed.`,
    failure: t`Your transaction has failed. Please go back and try again.`,
  };
  switch (action) {
    case SIGNING_ACTIONS.APPROVE:
    case SIGNING_ACTIONS.APPROVE_IRC2: {
      if (transactionInfo) {
        if (transactionInfo?.networkSrc === CHAIN_NAME.ICON && checkIRC2Token(transactionInfo?.coinName)) {
          return {
            pending: t`Sending ${transactionInfo.coinName} to the bridge contract...`,
            success: t`Sent ${transactionInfo.coinName} to the bridge contract.`,
            failure: t`Couldn't SEND ${transactionInfo.coinName} for cross-chain transfers.`,
          };
        } else {
          return {
            pending: t`Approving ${transactionInfo.coinName} for cross-chain transfers...`,
            success: t`Approved ${transactionInfo.coinName} for cross-chain transfers.`,
            failure: t`Couldn't APPROVE ${transactionInfo.coinName} for cross-chain transfers.`,
          };
        }
      }
      break;
    }
    case SIGNING_ACTIONS.TRANSFER: {
      if (transactionInfo) {
        return {
          pending: t`Transferring ${transactionInfo.coinName} from ${transactionInfo.networkSrc} to ${transactionInfo.networkDst}...`,
          success: t`Transferred ${transactionInfo.value} ${transactionInfo.coinName} to ${transactionInfo.networkDst}.`,
          failure: t`Couldn't transfer ${transactionInfo.coinName} to ${transactionInfo.networkDst}. Try again.`,
        };
      }
      break;
    }
    case SIGNING_ACTIONS.RECLAIM: {
      if (transactionInfo) {
        return {
          pending: t`Removing ${transactionInfo.coinName} from the bridge contract...`,
          success: t`Removed ${transactionInfo.coinName} from the bridge contract.`,
          failure: t`Couldn't remove ${transactionInfo.coinName} from ${transactionInfo.networkSrc}. Try again.`,
        };
      }
      break;
    }
    default: {
      return defaultMessages;
    }
  }
  return defaultMessages;
};
