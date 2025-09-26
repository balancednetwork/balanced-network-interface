import React from 'react';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';
import {
  useCoinGeckoPrice,
  useCoinGeckoPrices,
  useCoinGeckoProcessedChartData,
  useCoinGeckoMarketData,
} from '@/queries/coingecko';

// Example component showing how to use CoinGecko API hooks
export const CoinGeckoExample: React.FC = () => {
  // Get price for a single coin
  const {
    price: suiPrice,
    priceChange24h: suiChange,
    isLoading: suiLoading,
  } = useCoinGeckoPrice(COINGECKO_COIN_IDS.SUI, 'usd');

  // Get prices for multiple coins
  const { prices: multiplePrices, isLoading: multipleLoading } = useCoinGeckoPrices(
    [COINGECKO_COIN_IDS.SUI, COINGECKO_COIN_IDS.ETH, COINGECKO_COIN_IDS.SOL],
    'usd',
  );

  // Get chart data for a coin
  const { data: chartData, isLoading: chartLoading } = useCoinGeckoProcessedChartData(
    COINGECKO_COIN_IDS.SUI,
    'usd',
    30, // 30 days
  );

  // Get market data for multiple coins
  const { data: marketData, isLoading: marketLoading } = useCoinGeckoMarketData(
    [COINGECKO_COIN_IDS.SUI, COINGECKO_COIN_IDS.ETH, COINGECKO_COIN_IDS.SOL],
    'usd',
  );

  if (suiLoading || multipleLoading || chartLoading || marketLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>CoinGecko API Example</h2>

      {/* Single Coin Price */}
      <div style={{ marginBottom: '20px' }}>
        <h3>SUI Price</h3>
        <p>Current Price: ${suiPrice?.toFixed(2)}</p>
        <p>24h Change: {suiChange?.toFixed(2)}%</p>
      </div>

      {/* Multiple Coin Prices */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Multiple Coin Prices</h3>
        {Object.entries(multiplePrices).map(([coinId, data]) => (
          <div key={coinId} style={{ marginBottom: '10px' }}>
            <strong>{coinId.toUpperCase()}:</strong> ${data.price.toFixed(2)}
            <span style={{ color: data.priceChange24h >= 0 ? 'green' : 'red' }}>
              ({data.priceChange24h.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>

      {/* Chart Data */}
      <div style={{ marginBottom: '20px' }}>
        <h3>SUI Chart Data (30 days)</h3>
        <p>Data Points: {chartData?.prices.length}</p>
        <p>First Price: ${chartData?.prices[0]?.price.toFixed(2)}</p>
        <p>Last Price: ${chartData?.prices[chartData.prices.length - 1]?.price.toFixed(2)}</p>
        <p>Currency: {chartData?.currency.toUpperCase()}</p>
      </div>

      {/* Market Data */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Market Data</h3>
        {marketData?.map(coin => (
          <div key={coin.id} style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px' }}>
            <h4>
              {coin.name} ({coin.symbol.toUpperCase()})
            </h4>
            <p>Price: ${coin.current_price.toFixed(2)}</p>
            <p>Market Cap: ${coin.market_cap.toLocaleString()}</p>
            <p>24h Volume: ${coin.total_volume.toLocaleString()}</p>
            <p>
              24h Change:
              <span style={{ color: coin.price_change_percentage_24h >= 0 ? 'green' : 'red' }}>
                {coin.price_change_percentage_24h.toFixed(2)}%
              </span>
            </p>
            <p>Market Cap Rank: #{coin.market_cap_rank}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple price display component
export const SimplePriceDisplay: React.FC<{ coinId: string; currency?: string }> = ({ coinId, currency = 'usd' }) => {
  const { price, priceChange24h, isLoading } = useCoinGeckoPrice(coinId, currency);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontWeight: 'bold' }}>${price?.toFixed(2)}</span>
      <span
        style={{
          color: (priceChange24h || 0) >= 0 ? 'green' : 'red',
          fontSize: '14px',
        }}
      >
        {(priceChange24h || 0).toFixed(2)}%
      </span>
    </div>
  );
};

// Chart data component (you would integrate this with your charting library)
export const ChartDataDisplay: React.FC<{
  coinId: string;
  days?: number | string;
  currency?: string;
}> = ({ coinId, days = 30, currency = 'usd' }) => {
  const { data: chartData, isLoading } = useCoinGeckoProcessedChartData(coinId, currency, days);

  if (isLoading) return <div>Loading chart data...</div>;

  if (!chartData) return <div>No chart data available</div>;

  return (
    <div>
      <h4>Chart Data for {coinId.toUpperCase()}</h4>
      <p>Period: {days} days</p>
      <p>Data Points: {chartData.prices.length}</p>
      <p>
        Price Range: ${Math.min(...chartData.prices.map(p => p.price)).toFixed(2)} - $
        {Math.max(...chartData.prices.map(p => p.price)).toFixed(2)}
      </p>
      <p>Currency: {currency.toUpperCase()}</p>

      {/* You can pass chartData.prices to your charting library */}
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Chart data ready for integration with your charting library
      </div>
    </div>
  );
};
