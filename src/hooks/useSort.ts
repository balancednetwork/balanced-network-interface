import { useState } from 'react';

export type SortingType = {
  key: string;
  order?: 'ASC' | 'DESC';
};

export default function useSort(initialState: SortingType) {
  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  const handleSortSelect = (clickedSortBy: SortingType) => {
    if (clickedSortBy.key === sortBy.key) {
      sortBy.order === 'DESC' ? (clickedSortBy.order = 'ASC') : (clickedSortBy.order = 'DESC');
    } else {
      clickedSortBy.order = 'DESC';
    }
    setSortBy(clickedSortBy);
  };

  const sortData = data => {
    const dataToSort = [...data];

    if (Object.keys(dataToSort[0]).indexOf(sortBy.key) < 0) {
      console.error("sorting key doesn't match any key in sorting items");
      return dataToSort;
    }

    if (sortBy.order === 'DESC') {
      dataToSort.sort((a, b) => {
        if (sortBy.key === 'holders' && a.name === 'ICON') return 1;
        if (sortBy.key === 'holders' && b.name === 'ICON') return -1;
        if (a[sortBy.key] > b[sortBy.key]) return -1;
        if (a[sortBy.key] < b[sortBy.key]) return 1;
        return 0;
      });
    } else {
      dataToSort.sort((a, b) => {
        if (sortBy.key === 'holders' && a.name === 'ICON') return 1;
        if (sortBy.key === 'holders' && b.name === 'ICON') return -1;
        if (a[sortBy.key] < b[sortBy.key]) return -1;
        if (a[sortBy.key] > b[sortBy.key]) return 1;
        return 0;
      });
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
