import React, { useState } from 'react';

import { Flex, SxStyleProp } from 'rebass';
import styled from 'styled-components';

import { Button } from '../Button';

interface Props {
  total: number;
  itemsPerPage: number;
  displayPages: number;
  currentPage: number;
  onChangePage?: (page: number) => void;
  sx?: SxStyleProp;
}

const NumberButton = styled(Button)`
  background: #087083;
  padding: 5px 10px !important;
  margin-right: 8px;
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

const Pagination: React.FC<Props> = ({ total, itemsPerPage, displayPages = 7, currentPage, onChangePage, sx }) => {
  const totalPages = total / itemsPerPage;
  const pages: React.ReactElement[] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(
      <NumberButton
        className={currentPage === i ? 'active' : ''}
        onClick={() => onChangePage && onChangePage(i)}
        key={i}
      >
        {i + 1}
      </NumberButton>,
    );
  }

  return (
    <Flex
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx,
      }}
    >
      {pages}
    </Flex>
  );
};

export const usePagination = () => {
  const [page, setPage] = useState(0);
  return {
    page,
    setPage,
    nextPage: () => setPage(prev => prev + 1),
    prevPage: () => setPage(prev => (prev > 0 ? prev - 1 : 0)),
  };
};

export default Pagination;
