import * as React from 'react';

import { widget, ChartingLibraryWidgetOptions, IChartingLibraryWidget, ResolutionString } from 'charting_library';

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
      theme: 'Dark',
      client_id: this.props.clientId,
      user_id: this.props.userId,
      charts_storage_url: this.props.chartsStorageUrl,
      charts_storage_api_version: this.props.chartsStorageApiVersion,
      custom_css_url: './themed.css',
      disabled_features: ['header_compare', 'timeframes_toolbar', 'header_saveload'],
    };

    const tvWidget = new widget(widgetOptions);
    const setActiveSymbol = this.props.setActiveSymbol!;
    tvWidget.onChartReady(() => {
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
