import React, { useState } from 'react';

import { Flex, SxStyleProp } from 'rebass';
import styled from 'styled-components';

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

const Pagination: React.FC<Props> = ({ totalPages, displayPages = 7, currentPage, onChangePage, sx }) => {
  const pages: React.ReactElement[] = [];
  const pageRange = totalPages > displayPages ? displayPages : totalPages;

  // const nextPage = () => onChangePage && onChangePage(currentPage + 1);
  // const prevPage = () => onChangePage && onChangePage(currentPage > 0 ? currentPage - 1 : 0);

  const halfRange = Math.floor(pageRange / 2);
  let page = currentPage > halfRange ? currentPage - halfRange : 0;
  for (let i = 0; i < pageRange; i++) {
    let _p = page;
    pages.push(
      <NumberButton
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

  return (
    <Flex
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx,
      }}
    >
      {/* <NumberButton disabled={currentPage === 0} onClick={prevPage}>
        {'<'}
      </NumberButton> */}
      {pages}
      {/* <NumberButton disabled={currentPage === totalPages} onClick={nextPage}>
        {'>'}
      </NumberButton> */}
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
