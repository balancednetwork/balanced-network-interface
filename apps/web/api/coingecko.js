// Load environment variables from .env.local for local development
if (process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=');
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn('Failed to load .env.local:', error.message);
  }
}

module.exports = async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { COINGECKO_API_KEY } = process.env;

    // Debug logging for local development
    if (process.env.NODE_ENV !== 'production') {
      console.log('COINGECKO_API_KEY loaded:', COINGECKO_API_KEY ? 'Yes' : 'No');
    }

    // Extract the path from the request
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';

    // Build cache key from request parameters
    const cacheKey = `${apiPath}_${JSON.stringify(req.query)}`;

    // Simple in-memory cache (in production, consider Redis or similar)
    if (!global.coingeckoCache) {
      global.coingeckoCache = new Map();
    }

    // Determine cache duration based on endpoint type
    const getCacheDuration = path => {
      if (path.includes('simple/price')) return 60000; // 1 minute for prices
      if (path.includes('market_chart')) return 300000; // 5 minutes for charts
      if (path.includes('coins/') && !path.includes('market_chart') && !path.includes('ohlc')) return 600000; // 10 minutes for coin details
      if (path.includes('coins/markets')) return 60000; // 1 minute for market data
      if (path.includes('ohlc')) return 300000; // 5 minutes for OHLC data
      return 300000; // Default 5 minutes
    };

    const cacheDuration = getCacheDuration(apiPath);
    const now = Date.now();

    // Check if we have cached data that's still valid
    const cachedData = global.coingeckoCache.get(cacheKey);
    if (cachedData && now - cachedData.timestamp < cacheDuration) {
      console.log(`Cache hit for ${cacheKey}`);

      // Set CORS headers
      const origin = req.headers.origin;
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://app.balanced.network',
        'https://balanced.network',
        'https://www.balanced.network',
      ];

      const isAllowedOrigin =
        allowedOrigins.includes(origin) ||
        (origin && origin.match(/^https:\/\/balanced-network-interface-[a-z0-9]+-balanced-defi\.vercel\.app$/));

      if (isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', Math.floor((now - cachedData.timestamp) / 1000));

      return res.status(200).json(cachedData.data);
    }

    // Build the CoinGecko API URL
    const apiUrl = `https://pro-api.coingecko.com/api/v3/${apiPath}`;

    // Prepare query parameters
    const queryParams = new URLSearchParams();

    // Copy all query parameters except 'path'
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path' && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          // For OHLC range endpoint, we don't need to map parameters
          queryParams.append(key, value);
        }
      }
    });

    // Add API key if available
    if (COINGECKO_API_KEY) {
      queryParams.append('x_cg_pro_api_key', COINGECKO_API_KEY);
    }

    // Build the final URL
    const finalUrl = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl;

    console.log(`Cache miss for ${cacheKey}, fetching from CoinGecko`);

    // Make the request to CoinGecko API
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Balanced Network Interface',
      },
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API error:', response.status, errorText);
      res.status(response.status).json({
        error: 'CoinGecko API request failed',
        status: response.status,
        message: errorText,
      });
      return;
    }

    // Get the response data
    const data = await response.json();

    // Cache the response
    global.coingeckoCache.set(cacheKey, {
      data: data,
      timestamp: now,
    });

    // Clean up old cache entries (keep only last 100 entries)
    if (global.coingeckoCache.size > 100) {
      const entries = Array.from(global.coingeckoCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      global.coingeckoCache.clear();
      entries.slice(0, 100).forEach(([key, value]) => {
        global.coingeckoCache.set(key, value);
      });
    }

    // Set CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://app.balanced.network',
      'https://balanced.network',
      'https://www.balanced.network',
    ];

    const isAllowedOrigin =
      allowedOrigins.includes(origin) ||
      (origin && origin.match(/^https:\/\/balanced-network-interface-[a-z0-9]+-balanced-defi\.vercel\.app$/));

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-TTL', Math.floor(cacheDuration / 1000));

    // Return the data
    res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
