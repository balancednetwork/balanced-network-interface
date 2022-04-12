import {
  IExternalDatafeed,
  IDatafeedChartApi,
  LibrarySymbolInfo,
  ResolutionString,
  HistoryCallback,
  OnReadyCallback,
  DatafeedConfiguration,
  SearchSymbolsCallback,
  ResolveCallback,
  SubscribeBarsCallback,
} from 'charting_library/charting_library';

import { getHistoryBars } from './customHistory';
import { Subscriber, formatBarItem } from './helpers';
import { PeriodParamsWithOptionalCountback } from './history-provider';

const __subs: Subscriber[] = [];
const LAST_BAR_CONSTANT = 604800000000;

class CustomDataFeed implements IExternalDatafeed, IDatafeedChartApi {
  public onReady(callback: OnReadyCallback): void {
    console.log('-----------------onReady running');
    setTimeout(() => callback(defaultConfig), 0);
  }

  public resolveSymbol(symbolName: string, onResolve: ResolveCallback, onError): void {
    //get symbolInfo from balanced supported tokens
    const result = this.getSymbolInfo(symbolName, 100000000);

    setTimeout(function () {
      console.log('------------resolveSymbol returning ' + result.name);
      onResolve(result);
    }, 0);
  }

  public searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback,
  ): void {}

  public getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParamsWithOptionalCountback,
    onResult: HistoryCallback,
    onError,
  ): void {
    const pair = { id: 3 };
    const { countBack } = periodParams;

    getHistoryBars(pair.id, resolution, periodParams.from * 1_000_000, periodParams.to * 1_000_000).then(response => {
      if (response.status === 200) {
        const { data } = response;
        const meta: { noData?: boolean } = {};

        const decimal = 18;
        const dataMapped = data.map(item => formatBarItem(item, decimal));

        if (countBack && countBack > data.length) {
          meta.noData = true;
        }

        onResult(dataMapped, meta);
      }
    });
  }

  public subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    onResetCacheNeededCallback: () => void,
  ): void {
    const _onTick = onTick;
    // const _guid = listenerGuid;
    const subListenerInterval: ReturnType<typeof setInterval> = setInterval(() => {
      console.log('logging from interval cb - ', listenerGuid);
      const pair = { id: 3 };
      const now = new Date().valueOf() * 1_000;

      getHistoryBars(pair.id, resolution, now - LAST_BAR_CONSTANT, now).then(response => {
        if (response.status === 200) {
          const { data } = response;
          const decimal = 18;
          const latestBar = formatBarItem(data.at(-1), decimal);
          _onTick(latestBar);
        }
      });
    }, 3000);

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
    // console.log('-x-x-x-x-x-x-x-x-x-x-x-x-x-x UNsibscribing: ', listenerGuid);
    const subIndex = __subs.findIndex(sub => sub.guid === listenerGuid);
    if (subIndex >= 0) {
      clearInterval(__subs[subIndex].listener);
      console.log('currentSubs: ', __subs);
    }
  }

  private getSymbolInfo(name: string, pricescale: number = 100): LibrarySymbolInfo {
    return {
      name: name,
      full_name: name,
      ticker: name,
      description: '',
      type: 'crypto',
      session: '24x7',
      exchange: '',
      listed_exchange: '',
      timezone: 'America/New_York',
      format: 'price',
      has_intraday: true,
      intraday_multipliers: ['5', '15', '60', '240'],
      has_weekly_and_monthly: true,
      pricescale: pricescale,
      minmov: 1,
      supported_resolutions: defaultConfig['supported_resolutions'] || ['60' as ResolutionString],
      volume_precision: 2,
      data_status: 'streaming',
    };
  }
}

const defaultConfig: DatafeedConfiguration = {
  supported_resolutions: [
    '5' as ResolutionString,
    '15' as ResolutionString,
    '60' as ResolutionString,
    '240' as ResolutionString,
    '1D' as ResolutionString,
    '1W' as ResolutionString,
  ],
};

export default CustomDataFeed;
