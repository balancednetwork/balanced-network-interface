import React, { useState } from 'react';

import { Flex, SxStyleProp } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from 'app/theme';

import { Button } from '../Button';

interface Props {
  totalPages: number;
  displayPages: number;
  currentPage: number;
  onChangePage?: (page: number) => void;
  sx?: SxStyleProp;
}

const NumberButton = styled(Button)`
  background: ${({ theme }) => theme.colors.paginationButtonBG};
  padding: 5px 10px !important;
  border-radius: 4px;
  :hover:not(.active) {
    background: ${({ theme }) => theme.colors.primary};
  }
  :hover.active {
    cursor: default;
  }
  &.active {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const Pagination: React.FC<Props> = ({ totalPages, currentPage, onChangePage, sx }) => {
  let pages: Array<string | number> = [];
  const hasManyPages = totalPages > 6;

  if (hasManyPages) {
    const page = currentPage + 1;
    if (page < 5) {
      pages = [1, 2, 3, 4, 5, '...', totalPages];
    } else {
      const morePages = totalPages - (page + 1) > 1;
      if (morePages) {
        pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
      } else {
        pages = [1, '...'];
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      }
    }
  } else {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  }
  const _pages = pages.map(item => {
    if (item === '...') return <Typography mx="1">...</Typography>;
    const page = (item as number) - 1;
    return (
      <NumberButton
        key={item.toString()}
        mx={1}
        className={currentPage === page ? 'active' : ''}
        onClick={() => {
          onChangePage && item !== '...' && onChangePage(page);
        }}
      >
        {item}
      </NumberButton>
    );
  });

  if (totalPages === 0) return null;

  return (
    <Flex
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx,
      }}
    >
      {_pages}
    </Flex>
  );
};

export const usePagination = () => {
  const [page, setPage] = useState(0);
  return {
    page,
    setPage,
  };
};

export default Pagination;
