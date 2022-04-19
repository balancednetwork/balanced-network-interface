import * as React from 'react';

import { widget, ChartingLibraryWidgetOptions, IChartingLibraryWidget, ResolutionString } from 'charting_library';

import DataFeed from './api';

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol'];
  interval: ChartingLibraryWidgetOptions['interval'];
  libraryPath: ChartingLibraryWidgetOptions['library_path'];
  clientId: ChartingLibraryWidgetOptions['client_id'];
  fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
  autosize: ChartingLibraryWidgetOptions['autosize'];
  container: ChartingLibraryWidgetOptions['container'];
  setActiveSymbol: (symbol: string | undefined) => void;
}

export interface ChartContainerState {}

export class TVChartContainer extends React.PureComponent<Partial<ChartContainerProps>, ChartContainerState> {
  private tvWidget: IChartingLibraryWidget | null = null;
  private ref: React.RefObject<HTMLDivElement> = React.createRef();

  public componentDidMount(): void {
    if (!this.ref.current) {
      return;
    }

    const widgetOptions: ChartingLibraryWidgetOptions = {
      debug: true,
      symbol: this.props.symbol,
      datafeed: new DataFeed(),
      interval: this.props.interval || ('4h' as ResolutionString),
      container: this.ref.current,
      library_path: '/charting_library/',
      locale: 'en',
      disabled_features: ['header_compare', 'timeframes_toolbar'],
      enabled_features: ['save_shortcut', 'header_saveload'],
      client_id: 'balanced',
      fullscreen: false,
      autosize: true,
      theme: 'Dark',
      custom_css_url: './themed.css',
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
