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
      debug: false,
      symbol: this.props.symbol,
      datafeed: new DataFeed(),
      interval: this.props.interval || ('4h' as ResolutionString),
      container: this.ref.current,
      library_path: '/charting_library/',
      locale: 'en',
      disabled_features: ['header_compare', 'timeframes_toolbar'],
      enabled_features: [],
      client_id: 'balanced',
      fullscreen: false,
      autosize: true,
      theme: 'Dark',
      overrides: {
        'paneProperties.background': '#0c2a4d',
        'scalesProperties.textColor': '#AAA',
        'paneProperties.vertGridProperties.color': 'rgba(0,0,0,0)',
        'paneProperties.horzGridProperties.color': 'rgba(0,0,0,0)',
        'mainSeriesProperties.candleStyle.upColor': '#2ca9b7',
        'mainSeriesProperties.candleStyle.downColor': '#fb6a6a',
        'mainSeriesProperties.candleStyle.wickUpColor': '#2ca9b7',
        'mainSeriesProperties.candleStyle.wickDownColor': '#fb6a6a',
        'mainSeriesProperties.lineStyle.color': '#2ca9b7',
        'mainSeriesProperties.areaStyle.color2': '#2ca9b7',
        'mainSeriesProperties.areaStyle.linecolor': '#2ca9b7',
      },
      custom_css_url: './themed.css',
    };

    const tvWidget = new widget(widgetOptions);
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
