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
    const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

    // Extract the path from the request
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';

    // Build the CoinGecko API URL
    const apiUrl = `https://api.coingecko.com/api/v3/${apiPath}`;

    // Prepare query parameters
    const queryParams = new URLSearchParams();

    // Copy all query parameters except 'path'
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path' && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    // Add API key if available
    if (COINGECKO_API_KEY) {
      queryParams.append('x_cg_demo_api_key', COINGECKO_API_KEY);
    }

    // Build the final URL
    const finalUrl = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl;

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

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
