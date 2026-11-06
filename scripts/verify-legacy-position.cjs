require('./register-typescript.cjs');
const { readLegacyPositions, normalizePositionHoldings } = require('../apps/web/src/queries/legacyPositions.ts');
const { parseUsdPrices } = require('../apps/web/src/store/oracle/usdPrices.ts');
const { readChainHeights } = require('../packages/xwagmi/src/xcall/utils/chainHeights.ts');

const endpoint = 'https://ctz.solidwallet.io/api/v3';
const loans = 'cx66d4d90f5f113eba575bf793570135f9b10cece1';
const oracle = 'cx133c6015bb29f692b12e71c1792fddf8f7014652';
const owner = process.argv[2] || '0x38.bsc/0x6A9a3F8120714e1E4053bbE42fa68219d306fa9c';

async function rpc(url, method, params) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Balanced-legacy-read-verification' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json();
  if (body.error) throw new Error(body.error.message);
  if (!response.ok) throw new Error(`RPC returned ${response.status}`);
  return body.result;
}

function call(to, method, params) {
  return rpc(endpoint, 'icx_call', { to, dataType: 'call', data: { method, params } });
}

async function main() {
  const tokens = await call(loans, 'getCollateralTokens', {});
  const position = await readLegacyPositions((method, params) => call(loans, method, params), owner, tokens);
  const decimals = Object.fromEntries(await Promise.all(Object.keys(position.holdings).map(async symbol => [
    symbol, Number(await call(tokens[symbol], 'decimals', {})),
  ])));
  console.log('Recovered position:', JSON.stringify({ owner, source: position.source, amounts: normalizePositionHoldings(position.holdings, decimals) }));
  const symbols = ['BTC', 'ETH', 'ICX'];
  const rawPrices = await Promise.all(
    symbols.map(symbol => call(oracle, 'getLastPriceInUSD', { symbol }).catch(() => null)),
  );
  const prices = parseUsdPrices(symbols, rawPrices);
  console.log('USD prices:', JSON.stringify(prices));
  if (!prices.BTC?.isGreaterThan(0)) throw new Error('No usable BTC price');
  const heights = await readChainHeights(['icon', 'bsc'], chain => ({
    getBlockHeight: async () =>
      chain === 'icon'
        ? BigInt((await rpc(endpoint, 'icx_getLastBlock')).height)
        : BigInt(await rpc('https://bsc-rpc.publicnode.com', 'eth_blockNumber', [])),
  }));
  console.log(
    'Direct chain heights:',
    JSON.stringify(heights, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
  );
  if (!heights.icon || !heights.bsc) throw new Error('Chain-height verification incomplete');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
