# CoinGecko API Integration

This integration provides React hooks for fetching cryptocurrency price data from the CoinGecko API.

## Setup

1. **Register for CoinGecko Demo Account** (Recommended)
   - Go to [CoinGecko API](https://www.coingecko.com/en/api)
   - Register for a free demo account to get stable rate limits (30 calls/minute)
   - Get your API key from the dashboard

2. **Configure API Key**
   - Create a `.env` file in `apps/web/` directory
   - Add your API key: `VITE_COINGECKO_API_KEY=your_api_key_here`
   - The API key is optional - the hooks will work without it (using public API limits)

3. **Rate Limits**
   - Public API: 5-15 calls/minute (variable) - no API key needed
   - Demo Account: 30 calls/minute (stable) - requires API key
   - Paid Plans: Higher limits available

## Usage Examples

### Basic Price Fetching

```typescript
import { useCoinGeckoPrice } from '@/queries/coingecko';
import { COINGECKO_COIN_IDS } from '@/constants/coingecko';

const MyComponent = () => {
  const { price, priceChange24h, isLoading } = useCoinGeckoPrice(
    COINGECKO_COIN_IDS.SUI,
    'usd'
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>SUI Price: ${price?.toFixed(2)}</p>
      <p>24h Change: {priceChange24h?.toFixed(2)}%</p>
    </div>
  );
};
```

### Multiple Coin Prices

```typescript
import { useCoinGeckoPrices } from '@/queries/coingecko';

const MyComponent = () => {
  const { prices, isLoading } = useCoinGeckoPrices(
    ['sui', 'ethereum', 'solana'],
    'usd'
  );

  return (
    <div>
      {Object.entries(prices).map(([coinId, data]) => (
        <div key={coinId}>
          {coinId.toUpperCase()}: ${data.price.toFixed(2)}
        </div>
      ))}
    </div>
  );
};
```

### Chart Data for Line Charts

```typescript
import { useCoinGeckoProcessedChartData } from '@/queries/coingecko';

const ChartComponent = () => {
  const { data: chartData, isLoading } = useCoinGeckoProcessedChartData(
    'sui',
    'usd',
    30 // 30 days
  );

  if (isLoading) return <div>Loading chart...</div>;

  // chartData.prices contains array of { timestamp, price, marketCap, volume }
  // Use this data with your charting library (Chart.js, Recharts, etc.)
  
  return (
    <div>
      <p>Data points: {chartData?.prices.length}</p>
      {/* Pass chartData.prices to your chart component */}
    </div>
  );
};
```

### Market Data for Coin Lists

```typescript
import { useCoinGeckoMarketData } from '@/queries/coingecko';

const CoinList = () => {
  const { data: marketData, isLoading } = useCoinGeckoMarketData(
    ['sui', 'ethereum', 'solana'],
    'usd'
  );

  return (
    <div>
      {marketData?.map(coin => (
        <div key={coin.id}>
          <h3>{coin.name}</h3>
          <p>Price: ${coin.current_price}</p>
          <p>Market Cap: ${coin.market_cap.toLocaleString()}</p>
          <p>24h Change: {coin.price_change_percentage_24h}%</p>
        </div>
      ))}
    </div>
  );
};
```

## Available Hooks

- `useCoinGeckoPrice(coinId, currency, enabled)` - Single coin price
- `useCoinGeckoPrices(coinIds, currency, enabled)` - Multiple coin prices
- `useCoinGeckoMarketChart(coinId, currency, days, enabled)` - Raw chart data
- `useCoinGeckoProcessedChartData(coinId, currency, days, enabled)` - Processed chart data
- `useCoinGeckoCoinDetails(coinId, enabled)` - Detailed coin information
- `useCoinGeckoMarketData(coinIds, currency, enabled)` - Market data for coin lists

## Supported Coins

The following coins are pre-configured in `COINGECKO_COIN_IDS`:

- SUI, ETH, SOL, BTC, ICX, BALN, USDC, USDT, BNB, ADA, MATIC, AVAX, DOT, LINK, UNI

## Chart Periods

Supported chart periods in `COINGECKO_CHART_PERIODS`:

- 1d, 7d, 14d, 30d, 90d, 180d, 1y, max

## Currencies

Supported currencies in `COINGECKO_CURRENCIES`:

- USD, EUR, GBP, JPY, KRW, CNY, BTC, ETH

## Error Handling

All hooks include error handling and will return error states that you can handle in your components:

```typescript
const { data, error, isLoading } = useCoinGeckoPrice('sui', 'usd');

if (error) {
  return <div>Error loading price data</div>;
}
```

## Caching

The hooks use React Query for caching with the following settings:
- Simple prices: 1 minute stale time, 1 minute refetch interval
- Chart data: 5 minutes stale time, 5 minutes refetch interval
- Market data: 1 minute stale time, 1 minute refetch interval

## Example Components

See `CoinGeckoExample.tsx` for complete usage examples including:
- Simple price display
- Multiple coin price lists
- Chart data integration
- Market data tables
