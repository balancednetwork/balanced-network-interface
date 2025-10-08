// CoinGecko API Response Types

export interface CoinGeckoSimplePrice {
  [coinId: string]: {
    [currency: string]: number;
  };
}

export interface CoinGeckoMarketChartData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoinGeckoCoinInfo {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
}

export interface CoinGeckoMarketData {
  current_price: { [currency: string]: number };
  market_cap: { [currency: string]: number };
  total_volume: { [currency: string]: number };
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_14d: number;
  price_change_percentage_30d: number;
  price_change_percentage_60d: number;
  price_change_percentage_200d: number;
  price_change_percentage_1y: number;
  market_cap_change_percentage_24h: number;
  price_change_24h_in_currency: { [currency: string]: number };
  price_change_percentage_1h_in_currency: { [currency: string]: number };
  price_change_percentage_24h_in_currency: { [currency: string]: number };
  price_change_percentage_7d_in_currency: { [currency: string]: number };
  price_change_percentage_14d_in_currency: { [currency: string]: number };
  price_change_percentage_30d_in_currency: { [currency: string]: number };
  price_change_percentage_60d_in_currency: { [currency: string]: number };
  price_change_percentage_200d_in_currency: { [currency: string]: number };
  price_change_percentage_1y_in_currency: { [currency: string]: number };
  market_cap_change_24h_in_currency: { [currency: string]: number };
  market_cap_change_percentage_24h_in_currency: { [currency: string]: number };
  total_supply: number;
  max_supply: number;
  circulating_supply: number;
  last_updated: string;
}

export interface CoinGeckoCoinDetails {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string | null;
  platforms: { [platform: string]: string };
  detail_platforms: {
    [platform: string]: {
      decimal_place: number;
      contract_address: string;
    };
  };
  block_time_in_minutes: number;
  hashing_algorithm: string;
  categories: string[];
  preview_listing: boolean;
  public_notice: string | null;
  additional_notices: string[];
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    whitepaper: string;
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    facebook_username: string;
    bitcointalk_thread_identifier: string | null;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  country_origin: string;
  genesis_date: string;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  market_cap_rank: number;
  market_data: CoinGeckoMarketData;
  community_data: {
    facebook_likes: number | null;
    twitter_followers: number | null;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    reddit_subscribers: number | null;
    reddit_accounts_active_48h: number | null;
    telegram_channel_user_count: number | null;
  };
  developer_data: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    closed_issues: number;
    pull_requests_merged: number;
    pull_request_contributors: number;
    code_additions_deletions_4_weeks: {
      additions: number;
      deletions: number;
    };
    commit_count_4_weeks: number;
    last_4_weeks_commit_activity_series: number[];
  };
  status_updates: any[];
  last_updated: string;
  tickers: any[];
}

// Chart data point interface for easier usage
export interface ChartDataPoint {
  timestamp: number;
  price: number;
  marketCap: number;
  volume: number;
}

// Processed chart data for React components
export interface ProcessedChartData {
  prices: ChartDataPoint[];
  period: string;
  currency: string;
  coinId: string;
}
