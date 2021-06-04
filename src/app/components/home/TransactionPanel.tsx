import '@reach/tabs/styles.css';
import React, { useEffect, useMemo, useState } from 'react';

import { getLoanTransation, getTotalTransactions, Transaction } from 'apis';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Box, Flex, Link } from 'rebass';
import styled from 'styled-components';

import Pagination, { usePagination } from 'app/components/Pagination';
import { BoxPanel } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import externalIcon from 'assets/images/external.svg';
import { BLOCK_SCAN_URL } from 'constants/index';

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

const RETURN_ASSET = 'returnAsset';
const WITHDRAWN = 'withdrawCollateral';

const RowItem: React.FC<{ tran: Transaction }> = ({ tran }) => {
  const {
    data: {
      params: { _value },
      method,
    },
  } = tran;
  const amount = tran.data.params._value ? (parseInt(tran.data.params._value) / 10e18).toFixed(0) : 0;
  const sign = useMemo(() => {
    if (_value) {
      return method === WITHDRAWN ? '+' : '-';
    }
  }, [_value, method]);

  const content = useMemo(() => {
    switch (method) {
      case RETURN_ASSET:
        return `Repaid ${amount} Balanced Dollars`;
      case WITHDRAWN:
        return `Withdrew ${amount} ICX collateral`;
      default:
        return method;
    }
  }, [method, amount]);

  return (
    <RowContent>
      <Typography>{dayjs(tran.block_timestamp).format('D MMMM, HH:mm')}</Typography>
      <Flex>
        <Typography fontSize={16} sx={{ mr: '8px' }}>
          {content}
        </Typography>
        <Link
          href={`${BLOCK_SCAN_URL}/${tran.item_id.split('_')[1]}`}
          target="_blank"
          rel="noreferrer noopener"
          sx={{
            display: 'inline-flex',
            paddingBottom: 2,
          }}
        >
          <img src={externalIcon} alt="external link" width="11" />
        </Link>
      </Flex>
      <Typography fontSize={16} textAlign="right">
        <span
          style={{
            color: sign === '+' ? '#2fccdc' : 'red',
          }}
        >
          {sign}
        </span>{' '}
        {amount} {tran.data.params._symbol ?? 'ICX'}
      </Typography>
    </RowContent>
  );
};

const TransactionPanel = () => {
  const [list, setList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const { t } = useTranslation();
  const { page, setPage } = usePagination();
  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(() => true);
      try {
        const result = await getLoanTransation({
          skip: page * limit,
          limit,
        });
        setList(result);
      } catch (ex) {
        console.log(ex);
      }
      setLoading(() => false);
    };
    fetchData();
  }, [page]);

  useEffect(() => {
    (async () => {
      const result = await getTotalTransactions();
      setTotal(result.loans_transactions);
    })();
  }, []);

  return (
    <BoxPanel bg="bg2">
      <Flex mb={2} alignItems="center">
        <Typography mr={2} variant="h2">
          {t`Transaction history`}
        </Typography>
        {loading && <Spinner />}
      </Flex>
      <Table>
        <Row>
          <Typography letterSpacing="3px">{t`DATE`}</Typography>
          <Typography letterSpacing="3px" sx={{ flex: 1 }}>
            {t`ACTIVITY`}
          </Typography>
          <Typography letterSpacing="3px" textAlign="right">
            {t`AMOUNT`}
          </Typography>
        </Row>
        {list.map(item => (
          <RowItem tran={item} key={item.item_id} />
        ))}
      </Table>
      <Pagination
        sx={{ mt: 2 }}
        onChangePage={page => {
          if (!loading) {
            setPage(page);
          }
        }}
        currentPage={page}
        totalPages={Math.floor(total / limit)}
        displayPages={7}
      />
    </BoxPanel>
  );
};

export default TransactionPanel;
