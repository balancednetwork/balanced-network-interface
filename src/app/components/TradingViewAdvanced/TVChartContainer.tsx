import * as React from 'react';

import { widget, ChartingLibraryWidgetOptions, IChartingLibraryWidget, ResolutionString } from 'charting_library';

import { theme } from 'app/theme';

import DataFeed from './api';

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol'];
  interval: ChartingLibraryWidgetOptions['interval'];
  libraryPath: ChartingLibraryWidgetOptions['library_path'];
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
  clientId: ChartingLibraryWidgetOptions['client_id'];
  userId: ChartingLibraryWidgetOptions['user_id'];
  fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
  autosize: ChartingLibraryWidgetOptions['autosize'];
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
  container: ChartingLibraryWidgetOptions['container'];
  locale: ChartingLibraryWidgetOptions['locale'];
  setActiveSymbol: (symbol: string | undefined) => void;
}

export interface ChartContainerState {}

export class TVChartContainer extends React.PureComponent<Partial<ChartContainerProps>, ChartContainerState> {
  public static defaultProps: Omit<ChartContainerProps, 'container'> = {
    symbol: 'BALN/BNUSD',
    interval: '60' as ResolutionString,
    libraryPath: '/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    clientId: '_balanced_',
    userId: 'not_signed_in',
    locale: 'en',
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
    setActiveSymbol: () => {},
  };

  private tvWidget: IChartingLibraryWidget | null = null;
  private ref: React.RefObject<HTMLDivElement> = React.createRef();

  public componentDidMount(): void {
    if (!this.ref.current) {
      return;
    }

    const widgetOptions: ChartingLibraryWidgetOptions = {
      debug: false,
      symbol: this.props.symbol,
      datafeed: new DataFeed(),
      interval: this.props.interval || ('4h' as ResolutionString),
      container: this.ref.current,
      library_path: this.props.libraryPath as string,
      locale: this.props.locale || 'en',
      fullscreen: this.props.fullscreen,
      autosize: this.props.autosize,
      client_id: this.props.clientId,
      user_id: this.props.userId,
      charts_storage_url: this.props.chartsStorageUrl,
      charts_storage_api_version: this.props.chartsStorageApiVersion,
      theme: 'Dark',
      custom_css_url: './themed.css',
      disabled_features: ['header_compare', 'timeframes_toolbar', 'header_saveload'],
    };

    const tvWidget = new widget(widgetOptions);
    const setActiveSymbol = this.props.setActiveSymbol!;
    tvWidget.onChartReady(() => {
      tvWidget.applyOverrides({
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': theme().colors.bg4,
        'paneProperties.vertGridProperties.color': 'rgba(0,0,0,0)',
        'paneProperties.horzGridProperties.color': 'rgba(0,0,0,0)',

        'mainSeriesProperties.statusViewStyle.symbolTextSource': 'ticker',

        'mainSeriesProperties.priceLineColor': theme().colors.primary,

        'mainSeriesProperties.candleStyle.upColor': theme().colors.primary,
        'mainSeriesProperties.candleStyle.downColor': theme().colors.alert,
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderColor': theme().colors.primary,
        'mainSeriesProperties.candleStyle.borderUpColor': theme().colors.primary,
        'mainSeriesProperties.candleStyle.borderDownColor': theme().colors.alert,
        'mainSeriesProperties.candleStyle.wickUpColor': theme().colors.primary,
        'mainSeriesProperties.candleStyle.wickDownColor': theme().colors.alert,

        'mainSeriesProperties.hollowCandleStyle.upColor': theme().colors.primary,
        'mainSeriesProperties.hollowCandleStyle.downColor': theme().colors.alert,
        'mainSeriesProperties.hollowCandleStyle.drawWick': true,
        'mainSeriesProperties.hollowCandleStyle.drawBorder': true,
        'mainSeriesProperties.hollowCandleStyle.borderColor': theme().colors.primary,
        'mainSeriesProperties.hollowCandleStyle.borderUpColor': theme().colors.primary,
        'mainSeriesProperties.hollowCandleStyle.borderDownColor': theme().colors.alert,
        'mainSeriesProperties.hollowCandleStyle.wickUpColor': theme().colors.primary,
        'mainSeriesProperties.hollowCandleStyle.wickDownColor': theme().colors.alert,

        'mainSeriesProperties.haStyle.upColor': theme().colors.primary,
        'mainSeriesProperties.haStyle.downColor': theme().colors.alert,
        'mainSeriesProperties.haStyle.drawWick': true,
        'mainSeriesProperties.haStyle.drawBorder': true,
        'mainSeriesProperties.haStyle.borderColor': theme().colors.primary,
        'mainSeriesProperties.haStyle.borderUpColor': theme().colors.primary,
        'mainSeriesProperties.haStyle.borderDownColor': theme().colors.alert,
        'mainSeriesProperties.haStyle.wickUpColor': theme().colors.primary,
        'mainSeriesProperties.haStyle.wickDownColor': theme().colors.alert,

        'mainSeriesProperties.barStyle.upColor': theme().colors.primary,
        'mainSeriesProperties.barStyle.downColor': theme().colors.alert,

        'mainSeriesProperties.lineStyle.color': theme().colors.primary,

        'mainSeriesProperties.areaStyle.color1': 'rgba(33, 150, 243, 0.28)',
        'mainSeriesProperties.areaStyle.color2': theme().colors.primary,
        'mainSeriesProperties.areaStyle.linecolor': theme().colors.primary,

        'mainSeriesProperties.baselineStyle.topLineColor': theme().colors.primary,
        'mainSeriesProperties.baselineStyle.bottomLineColor': theme().colors.alert,
      });
      tvWidget
        .activeChart()
        .onSymbolChanged()
        .subscribe(null, () => setActiveSymbol(tvWidget.activeChart().symbol()));
    });
    this.tvWidget = tvWidget;
  }

  public componentWillUnmount(): void {
    if (this.tvWidget !== null) {
      this.tvWidget.remove();
      this.tvWidget = null;
    }
  }

  public render(): JSX.Element {
    return <div ref={this.ref} className={'TVChartContainer'} />;
  }
}
