import {
  IExternalDatafeed,
  IDatafeedChartApi,
  ResolutionString,
  HistoryCallback,
  OnReadyCallback,
  SearchSymbolsCallback,
  ResolveCallback,
  SubscribeBarsCallback,
  PeriodParams,
} from 'charting_library/charting_library';
import { DatafeedConfiguration } from 'charting_library/datafeed-api';

import { SUPPORTED_PAIRS } from 'constants/pairs';
import { formatBarItem } from 'queries/swap';

import { getHistoryBars } from './history';
import { BalancedLibrarySymbolInfo, getFilteredSupportedPairNames, getSymbolInfo } from './symbols';

interface Subscriber {
  guid: string;
  symbolInfo: BalancedLibrarySymbolInfo;
  resolution: ResolutionString;
  listener: ReturnType<typeof setInterval>;
  cb: SubscribeBarsCallback;
}

const __subs: Subscriber[] = [];

const LAST_BAR_CONSTANT = 604800000000;

const TIME_FORMAT_CONSTATNT = 1_000;

const PAIR_NAMES = SUPPORTED_PAIRS.map(pair => pair.name);

type PeriodParamsWithOptionalCountBack = Omit<PeriodParams, 'countBack'> & { countBack?: number };

export const defaultConfig: DatafeedConfiguration = {
  supported_resolutions: [
    '60' as ResolutionString,
    '120' as ResolutionString,
    '240' as ResolutionString,
    '480' as ResolutionString,
    '1D' as ResolutionString,
    '2D' as ResolutionString,
  ],
};

class DataFeed implements IExternalDatafeed, IDatafeedChartApi {
  public onReady(callback: OnReadyCallback): void {
    setTimeout(() => callback(defaultConfig), 0);
  }

  public async resolveSymbol(symbolName: string, onResolve: ResolveCallback, onError) {
    const result = await getSymbolInfo(symbolName);

    setTimeout(function () {
      onResolve(result);
    }, 0);
  }

  public searchSymbols(userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback): void {
    let input = userInput;
    if (PAIR_NAMES.indexOf(input) >= 0) {
      input = '';
    }
    onResult(getFilteredSupportedPairNames(input.replace('/', '')));
  }

  public getBars(
    symbolInfo: BalancedLibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParamsWithOptionalCountBack,
    onResult: HistoryCallback,
    onError,
  ): void {
    const { countBack } = periodParams;

    getHistoryBars(symbolInfo.pairID, resolution, periodParams.from, periodParams.to).then(response => {
      if (response.status === 200) {
        const { data } = response;
        const meta: { noData?: boolean } = {};
        const dataMapped = data.map(item =>
          formatBarItem(item, symbolInfo.decimal, symbolInfo.isPairInverted, TIME_FORMAT_CONSTATNT),
        );

        if (countBack && countBack > data.length) {
          meta.noData = true;
        }

        onResult(dataMapped, meta);
      }
    });
  }

  public subscribeBars(
    symbolInfo: BalancedLibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void,
  ): void {
    const _onTick = onTick;
    const _symbolInfo = symbolInfo;
    const subListenerInterval: ReturnType<typeof setInterval> = setInterval(() => {
      const now = new Date().valueOf() * 1_000;

      getHistoryBars(_symbolInfo.pairID, resolution, now - LAST_BAR_CONSTANT, now).then(response => {
        if (response.status === 200) {
          const { data } = response;
          const latestBar = formatBarItem(
            data.at(-1),
            _symbolInfo.decimal,
            _symbolInfo.isPairInverted,
            TIME_FORMAT_CONSTATNT,
          );
          _onTick(latestBar);
        }
      });
    }, 5000);

    const existingSubIndex = __subs.findIndex(e => e.guid === listenerGuid);
    if (existingSubIndex >= 0) {
      __subs[existingSubIndex].listener = subListenerInterval;
    } else {
      __subs.push({
        guid: listenerGuid,
        resolution,
        symbolInfo,
        cb: onTick,
        listener: subListenerInterval,
      });
    }
  }

  public unsubscribeBars(listenerGuid: string): void {
    const subIndex = __subs.findIndex(sub => sub.guid === listenerGuid);
    if (subIndex >= 0) {
      clearInterval(__subs[subIndex].listener);
    }
  }
}

export default DataFeed;
