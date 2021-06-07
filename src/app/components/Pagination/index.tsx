import React, { useState } from 'react';

import { Flex, SxStyleProp } from 'rebass';
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
  background: #087083;
  padding: 5px 10px !important;
  border-radius: 4px;
  :hover:not(.active) {
    background: #2ca9b7;
  }
  :hover.active {
    cursor: default;
  }
  &.active {
    background: #2ca9b7;
  }
`;

const Pagination: React.FC<Props> = ({ totalPages, currentPage, onChangePage, sx }) => {
  const pages: React.ReactElement[] = [];
  const displayPages = currentPage >= 4 && currentPage <= totalPages - 5 ? 3 : 4;
  const pageRange = totalPages > displayPages ? displayPages : totalPages;

  const halfRange = Math.floor(pageRange / 2);
  let page = currentPage - halfRange;

  if (currentPage < 4) {
    page = 1;
  } else if (currentPage > totalPages - 5) {
    page = totalPages - 5;
  }

  for (let i = 0; i < pageRange; i++) {
    let _p = page;
    pages.push(
      <NumberButton
        mx={1}
        className={currentPage === page ? 'active' : ''}
        onClick={() => {
          onChangePage && onChangePage(_p);
        }}
        key={i}
      >
        {page + 1}
      </NumberButton>,
    );
    page++;
  }

  if (totalPages === 0) return null;

  return (
    <Flex
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx,
      }}
    >
      <NumberButton
        className={currentPage === 0 ? 'active' : ''}
        onClick={() => {
          onChangePage && onChangePage(0);
        }}
        mx="1"
      >
        1
      </NumberButton>
      {currentPage > 3 && <Typography mx="1">...</Typography>}
      {pages}
      {currentPage <= totalPages - 5 && <Typography mx="1">...</Typography>}
      <NumberButton
        className={currentPage === totalPages ? 'active' : ''}
        onClick={() => {
          onChangePage && onChangePage(totalPages);
        }}
        mx="1"
      >
        {totalPages}
      </NumberButton>
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
