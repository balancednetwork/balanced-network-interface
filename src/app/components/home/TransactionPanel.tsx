import React from 'react';

import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { SupportedChainId as NetworkId } from 'packages/BalancedJs';
import addresses from 'packages/BalancedJs/addresses';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex, Link } from 'rebass/styled-components';
import styled from 'styled-components';

import Pagination, { usePagination } from 'app/components/Pagination';
import { BoxPanel } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { PairInfo, SUPPORTED_PAIRS } from 'constants/pairs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { Transaction, useAllTransactionsQuery, useInternalTransactionQuery } from 'queries/history';
import { formatBigNumber, formatUnits, getTrackerLink } from 'utils';

const Row = styled(Box)`
  display: grid;
  padding: 20px 0;
  grid-template-columns: 25% 1fr;
  align-items: center;
  grid-column-gap: 20px;
  > div:last-child,
  > p:last-child {
    display: none;
  }

  ${({ theme }) => theme.mediaWidth.upLarge`
    grid-template-columns: 17% 1fr 15%;
    > div:last-child,
    > p:last-child {
      display: block;
    }
  `}
`;

const RowContent = styled(Row)`
  border-bottom: 1px solid #304a68;
`;

const Table = styled(Box)`
  > div:last-child {
    border-bottom: 0;
  }
`;

const ScrollHelper = styled.div`
  overflow-x: auto;
  width: 100%;

  ${Table} {
    min-width: 560px;
    width: 100%;
  }
`;

const METHOD_CONTENT = {
  SupplyICX: 'Supplied (amount) ICX to the ICX / sICX pool',
  RewardsClaimed: 'Claimed (amount) BALN',
  stake: 'Adjusted BALN stake',
  withdrawCollateral: 'Withdrew (amount) sICX collateral',
  LoanRepaid: 'Repaid (amount) bnUSD',
  OriginateLoan: 'Borrowed (amount) bnUSD',
  cancelSicxicxOrder: 'Withdrew (amount) ICX from the ICX / sICX pool',
  ClaimSicxEarnings: 'Withdrew (amount) sICX from the ICX / sICX pool',
  CollateralReceived: 'Deposited (amount) sICX as collateral ',
  UnstakeSICXRequest: 'Unstaked (amount) sICX',
  UnstakeRequest: '',
  claimUnstakedICX: 'Claimed (amount) ICX',
  Deposit: 'Transferred (amount) (currency) to the Balanced exchange',
  Withdraw1Value: 'Withdrew (amount) (currency)',
  VoteCast: '',
  Claimed: 'Claimed network fees',
  TokenTransfer: '',
  Transfer: '',
  Rebalance: '',

  //  2 symbols
  stakeICX: 'Swapped (amount1) ICX for (amount2) sICX',
  Remove: 'Removed (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Swap: 'Swapped (amount1) (currency1) for (amount2) (currency2)',
  AssetRetired: 'Retired (amount) bnUSD for (amount) sICX',
  Withdraw: 'Withdrew (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Add: 'Supplied (amount1) (currency1) and (amount2) (currency2) to the (currency1) / (currency2) pool',
};

const METHOD_POSITIVE_SIGN = [
  'ClaimSicxEarnings',
  'RewardsClaimed',
  'withdrawCollateral',
  'OriginateLoan',
  'cancelSicxicxOrder',
  'Withdraw1Value',
];

const getTokenSymbol = (address?: string) =>
  SUPPORTED_TOKENS_LIST.find(token => token.address === address)?.symbol || '';

const getContractAddr = (tx: Transaction) => tx.indexed?.find(item => item.startsWith('cx'));

const AmountItem = ({ value, symbol, positive }: { value?: string; symbol?: string; positive?: boolean }) => (
  <Typography variant="p" textAlign="right">
    {parseFloat(value || '') !== 0 && (
      <span
        style={{
          color: positive !== undefined ? (positive ? '#2fccdc' : 'red') : '',
        }}
      >
        {positive !== undefined && (positive ? '+' : '-')}{' '}
      </span>
    )}
    {value} {symbol}
  </Typography>
);

const convertValue = (value: string, currencyKey?: string) => {
  const decimals = SUPPORTED_TOKENS_LIST.find(token => token.symbol === currencyKey)?.decimals;
  const currency = new BigNumber(formatUnits(value, decimals || 18));
  const exceptionList = ['IUSDT', 'IUSDC'];

  return currency.isGreaterThan(0.004) || (currencyKey && exceptionList.includes(currencyKey))
    ? formatBigNumber(currency, 'currency')
    : '';
};

const getValue = (tx: Transaction) => {
  const { indexed, data, value } = tx;
  let _value =
    indexed?.find(item => item.startsWith('0x')) || (data?.find && data?.find(item => item.startsWith('0x'))) || value;

  if (!_value) return '';

  const tokenSymbol = getTokenSymbol(getContractAddr(tx));

  return convertValue(_value, tokenSymbol);
};

const getMethod = (tx: Transaction) => {
  let method: keyof typeof METHOD_CONTENT | '' = tx.method as any;
  if (!method) {
    method = (tx.data as any)?.method as any;
  }
  return method || '';
};

const getSymbolByPoolId = (poolId: number) => {
  const pool: PairInfo | undefined = SUPPORTED_PAIRS.find(pool => pool.id === poolId);
  return { symbol1: pool?.baseCurrencyKey || '', symbol2: pool?.quoteCurrencyKey || '' };
};

const getValuesAndSymbols = (tx: Transaction) => {
  const method = getMethod(tx);

  switch (method) {
    case 'Claimed': {
      let result;

      if (Array.isArray(tx.data)) {
        try {
          const data = JSON.parse(tx.data[tx.data.length - 1].replace(/'/g, '"'));
          result = Object.keys(data).reduce((acc: { symbol: string; amount: string }[], current) => {
            if (data[current] !== 0) {
              return [
                ...acc,
                {
                  symbol: getTokenSymbol(current),
                  amount: convertValue(data[current], getTokenSymbol(current)),
                },
              ];
            }
            return acc;
          }, []);
        } catch (ex) {
          console.log(ex);
        }
      }

      return result;
    }
    case 'stake': {
      const amount1 = convertValue((tx.data as any)?.params?._value || 0);
      return { amount1, amount2: '', symbol1: 'BALN', symbol2: '' };
    }
    case 'Remove':
    case 'Add': {
      const poolId = parseInt(tx.indexed[1]);
      const { symbol1, symbol2 } = getSymbolByPoolId(poolId);
      const amount1 = convertValue(tx.data[0], symbol1);
      const amount2 = convertValue(tx.data[1], symbol2);

      return { amount1, amount2, symbol1, symbol2 };
    }
    case 'Swap': {
      let symbol1 = getTokenSymbol(tx.data[0]);
      let symbol2 = getTokenSymbol(tx.data[1]);

      if (!symbol2) {
        symbol1 = 'sICX';
        symbol2 = 'ICX';
      }
      const amount1 = convertValue(tx.data[4], symbol1);
      const amount2 = convertValue(tx.data[5], symbol2);

      return { amount1, amount2, symbol1, symbol2 };
    }
    case 'Withdraw1Value':
    case 'Deposit': {
      const symbol1 = getTokenSymbol(getContractAddr(tx));
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1, symbol2: '' };
    }
    case 'UnstakeSICXRequest': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'claimUnstakedICX': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'ICX', symbol2: '' };
    }
    case 'RewardsClaimed': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'BALN', symbol2: '' };
    }
    case 'withdrawCollateral': {
      const amount1 = convertValue((tx.data as any)?.params?._value || 0);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'stakeICX': {
      const amount1 = getValue(tx);
      const amount2 = convertValue(tx.to_value);
      return { amount1, amount2: amount2, symbol1: 'ICX', symbol2: 'sICX' };
    }
    case 'SupplyICX':
    case 'cancelSicxicxOrder': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'ICX', symbol2: '' };
    }
    case 'CollateralReceived':
    case 'ClaimSicxEarnings': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'LoanRepaid':
    case 'OriginateLoan': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'bnUSD', symbol2: '' };
    }
    case 'Withdraw': {
      const amount1 = convertValue(tx.data.fromValue);
      const symbol1 = getTokenSymbol(tx.data.from);
      const amount2 = convertValue(tx.data.toValue);
      const symbol2 = getTokenSymbol(tx.data.to);
      return { amount1, amount2, symbol1, symbol2 };
    }
    default: {
      const amount1 = getValue(tx);
      const symbol1 =
        tx.indexed?.find(item => SUPPORTED_TOKENS_LIST.find(token => token.symbol === item)?.symbol) || '';

      return { amount1, amount2: '', symbol1, symbol2: '' };
    }
  }
};

const getAmountWithSign = (tx: Transaction) => {
  const method = getMethod(tx);
  switch (method) {
    case 'Remove': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive />
          <AmountItem value={amount2} symbol={symbol2} positive />
        </>
      );
    }
    case 'Withdraw': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive />
          <AmountItem value={amount2} symbol={symbol2} positive />
        </>
      );
    }
    case 'Add': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive={false} />
          <AmountItem value={amount2} symbol={symbol2} positive={false} />
        </>
      );
    }
    case 'Swap': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive={false} />
          <AmountItem value={amount2} symbol={symbol2} positive={true} />
        </>
      );
    }
    case 'stakeICX': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount2} symbol={symbol2} positive={true} />
          <AmountItem value={amount1} symbol={symbol1} positive={false} />
        </>
      );
    }
    case 'ClaimSicxEarnings': {
      const { amount1, symbol1 } = getValuesAndSymbols(tx);
      return <AmountItem value={amount1} symbol={symbol1} positive />;
    }

    case 'Claimed': {
      const amountItemList = getValuesAndSymbols(tx);

      return amountItemList.map(({ symbol, amount }) => (
        <AmountItem key={symbol + amount} value={amount} symbol={symbol} positive={true} />
      ));
    }

    case 'VoteCast':
      return '';

    case 'stake': {
      const { amount1, symbol1 } = getValuesAndSymbols(tx);
      return <AmountItem value={amount1} symbol={symbol1} />;
    }

    default:
      const positive = METHOD_POSITIVE_SIGN.includes(method);
      const { amount1, symbol1 } = getValuesAndSymbols(tx);
      return <AmountItem value={amount1} symbol={symbol1} positive={positive} />;
  }

  // handle merge 2 transaction
};
const ClaimRowItem: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const { data } = useInternalTransactionQuery(tx.hash);
  if (data) return <RowItem tx={{ ...data[0], method: 'claimUnstakedICX' }} />;
  return null;
};
const RowItem: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const { networkId } = useIconReact();

  const method = tx.method as keyof typeof METHOD_CONTENT;

  const getContent = () => {
    let content = METHOD_CONTENT[method] || method;
    switch (method) {
      case 'Remove':
      case 'Add':
      case 'Withdraw':
      case 'stakeICX':
      case 'Swap': {
        const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);

        if (!amount1 || !amount2) {
          content = '';
        } else {
          content = content.replace(/\(currency1\)/gi, symbol1);
          content = content.replace('(amount1)', amount1);
          content = content.replace(/\(currency2\)/gi, symbol2);
          content = content.replace('(amount2)', amount2);
        }
        break;
      }

      case 'VoteCast': {
        const approved = tx.indexed.find(item => item === '0x1');
        content = approved ? 'Approved a proposal' : 'Rejected a proposal';
        break;
      }

      case 'Claimed': {
        const claimedList = getValuesAndSymbols(tx);
        if (claimedList.length === 0) {
          content = '';
        }
        break;
      }

      default:
        const { amount1, symbol1 } = getValuesAndSymbols(tx);
        if (!amount1) {
          content = '';
        } else {
          content = content.replace('(currency)', symbol1);
          content = content.replace('(amount)', amount1);
        }
        break;
    }
    return content;
  };

  const hash = tx.item_id.split('_')[1];

  const content = getContent();
  if (!content) return null;

  return (
    <RowContent>
      <Typography minWidth="150px">{dayjs(tx.item_timestamp).format('D MMMM, HH:mm')}</Typography>
      <Flex>
        <Typography fontSize={16} sx={{ mr: '8px' }}>
          {content}
        </Typography>
        <Link
          href={getTrackerLink(networkId, hash, 'transaction')}
          target="_blank"
          rel="noreferrer noopener"
          sx={{
            display: 'inline-flex',
            paddingBottom: 2,
          }}
        >
          <ExternalIcon width="11px" height="11px" />
        </Link>
      </Flex>
      <Box>{getAmountWithSign(tx)}</Box>
    </RowContent>
  );
};

const isDexContract = (addr: string) => {
  return addresses[NetworkId.MAINNET].dex === addr;
};

const issICXContract = (_tx: Transaction) => {
  return _tx.indexed.find(item => item === addresses[NetworkId.MAINNET].staking);
};

const checkAndParseICXToDex = (tx: Transaction): Transaction => {
  const _tx = { ...tx };

  if (!getMethod(_tx) && isDexContract(_tx.to_address)) {
    _tx.method = 'SupplyICX';
  }

  return _tx;
};

const checkAndParseICXTosICX = (tx: Transaction): Transaction => {
  const _tx = { ...tx };

  if (getMethod(_tx) === 'Transfer' && issICXContract(_tx)) {
    _tx.method = 'UnstakeSICXRequest';
  }

  return _tx;
};

const parseTransactions = (txs: Transaction[]) => {
  const transactions: Transaction[] = [];
  const rebalanceTransactions = txs.filter(tx => tx.method === 'Rebalance').map(tx => tx.transaction_hash);
  try {
    for (let i = 0; i < 10; i++) {
      let tx: Transaction = txs[i] && { ...txs[i] };
      if (tx && (tx.data || tx.indexed || tx.value) && !tx.ignore) {
        const method = getMethod(tx);

        switch (method) {
          case 'Withdraw': {
            // check if this is merging withdraw (2 tx and 1 tx remove)
            const mergeTxs = [tx];
            for (let j = i + 1; j < txs.length; j++) {
              const _tx = txs[j];
              const _method = getMethod(_tx);
              if (_tx.transaction_hash === tx.transaction_hash && ['Withdraw', 'Remove'].includes(_method)) {
                // ignore Remove, no need to show on ui
                if (_method === 'Withdraw') {
                  mergeTxs.push(_tx);
                }
                // mark ignored field
                _tx.ignore = true;
              }
            }

            if (mergeTxs.length === 2) {
              const mergeData = {
                from: mergeTxs[1].indexed.find(item => item.startsWith('cx')),
                fromValue: mergeTxs[1].data[0],
                to: mergeTxs[0].indexed.find(item => item.startsWith('cx')),
                toValue: mergeTxs[0].data[0],
              };
              tx.data = mergeData;
            } else {
              tx.method = 'Withdraw1Value';
            }

            transactions.push(tx);
            break;
          }

          // don't show content for this method,
          // because this transaction is combined with another transaction
          case 'TokenTransfer': {
            break;
          }

          case 'stakeICX': {
            // search for tokentransfer
            const secondTx = txs.find(
              item => getMethod(item) === 'TokenTransfer' && item.transaction_hash === tx?.hash,
            );
            if (secondTx) {
              tx.to_value = secondTx.indexed?.find((item: string) => item.startsWith('0x')) || '';
              transactions.push(tx);
            }
            break;
          }

          // don't show content for this method,
          // because this transaction is combined with another transaction
          case 'UnstakeRequest': {
            break;
          }

          //NOTE: https://github.com/balancednetwork/balanced-network-interface/issues/721
          case 'Rebalance': {
            break;
          }

          //NOTE: https://github.com/balancednetwork/balanced-network-interface/issues/721
          case 'Swap': {
            if (!rebalanceTransactions.includes(tx.transaction_hash)) transactions.push(tx);
            break;
          }

          default: {
            tx = checkAndParseICXToDex(tx);
            tx = checkAndParseICXTosICX(tx);

            transactions.push(tx);
            break;
          }
        }
      }
    }
  } catch (ex) {}

  return transactions;
};

const TransactionTable = () => {
  const { account } = useIconReact();
  const { page, setPage } = usePagination();
  const limit = 10;

  const { isLoading, data } = useAllTransactionsQuery(page, limit, account);

  const totalPages = Math.ceil((data?.count || 0) / limit);

  const txs = parseTransactions(data?.transactions || []);

  return (
    <BoxPanel bg="bg2">
      <Flex mb={2} alignItems="center" flexWrap="wrap">
        <Typography mr={2} mb={2} variant="h2" width="100%">
          Activity history
        </Typography>
        {isLoading && <Spinner />}

        {!isLoading && data?.count ? (
          <>
            <ScrollHelper>
              <Table>
                <Row>
                  <Typography letterSpacing="3px">DATE</Typography>
                  <Typography letterSpacing="3px" sx={{ flex: 1 }}>
                    ACTIVITY
                  </Typography>
                  <Typography letterSpacing="3px" textAlign="right">
                    AMOUNT
                  </Typography>
                </Row>
                {txs.map(tx =>
                  tx.method === 'claimUnstakedICX' ? (
                    <ClaimRowItem tx={tx} key={tx.item_id} />
                  ) : (
                    <RowItem tx={tx} key={tx.item_id} />
                  ),
                )}
              </Table>
            </ScrollHelper>
            <Pagination
              sx={{ mt: 2, width: '100%' }}
              onChangePage={page => {
                if (!isLoading) {
                  setPage(page);
                }
              }}
              currentPage={page}
              totalPages={totalPages}
              displayPages={7}
            />{' '}
          </>
        ) : (
          <Box width="100%">
            <Typography textAlign="center">No activity yet.</Typography>
          </Box>
        )}
      </Flex>
    </BoxPanel>
  );
};

const TransactionPanel = () => (
  <Box sx={{ gridColumn: ['auto', 'auto', 'auto', '1 / span 2'] }}>
    <TransactionTable />
  </Box>
);

export default TransactionPanel;
