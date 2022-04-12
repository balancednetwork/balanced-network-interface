import { LibrarySymbolInfo, ResolutionString, SubscribeBarsCallback } from 'charting_library/charting_library';
import { BalancedJs } from 'packages/BalancedJs';

export interface Subscriber {
  guid: string;
  symbolInfo: LibrarySymbolInfo;
  resolution: ResolutionString;
  listener: ReturnType<typeof setInterval>;
  cb: SubscribeBarsCallback;
}

export const formatBarItem = (bar, decimal) => {
  return {
    time: bar.time / 1_000,
    value: BalancedJs.utils.toFormat(bar.close, decimal).toNumber(),
    open: BalancedJs.utils.toFormat(bar.open, decimal).toNumber(),
    close: BalancedJs.utils.toFormat(bar.close, decimal).toNumber(),
    high: BalancedJs.utils.toFormat(bar.high, decimal).toNumber(),
    low: BalancedJs.utils.toFormat(bar.low, decimal).toNumber(),
    volume: BalancedJs.utils.toIcx(bar.volume).toNumber(),
  };
};

export interface RequestParams {
  [paramName: string]: string | string[] | number;
}

export interface UdfResponse {
  s: string;
}

export interface UdfOkResponse extends UdfResponse {
  s: 'ok';
}

export interface UdfErrorResponse {
  s: 'error';
  errmsg: string;
}

/**
 * If you want to enable logs from datafeed set it to `true`
 */
const isLoggingEnabled = false;
export function logMessage(message: string): void {
  if (isLoggingEnabled) {
    const now = new Date();
    // tslint:disable-next-line:no-console
    console.log(`${now.toLocaleTimeString()}.${now.getMilliseconds()}> ${message}`);
  }
}

export function getErrorMessage(error: string | Error | undefined): string {
  if (error === undefined) {
    return '';
  } else if (typeof error === 'string') {
    return error;
  }

  return error.message;
}
