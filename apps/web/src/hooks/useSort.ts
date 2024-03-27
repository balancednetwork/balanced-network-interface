import { useState } from 'react';

export type SortingType = {
  key: string;
  order?: 'ASC' | 'DESC';
};

const CUSTOM_SORT_KEYS = ['apyTotal'];

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

    if (
      dataToSort[0] &&
      Object.keys(dataToSort[0]).indexOf(sortBy.key) < 0 &&
      CUSTOM_SORT_KEYS.indexOf(sortBy.key) < 0
    ) {
      console.error("sorting key doesn't match any key in sorting items");
      return dataToSort;
    }

    if (sortBy.order === 'DESC') {
      if (sortBy.key === 'apyTotal') {
        dataToSort.sort((a, b) => {
          if (a['feesApy'] + (a['balnApy'] || 0) * 2.5 > b['feesApy'] + (b['balnApy'] || 0) * 2.5) return -1;
          if (a['feesApy'] + (a['balnApy'] || 0) * 2.5 < b['feesApy'] + (b['balnApy'] || 0) * 2.5) return 1;
          return 0;
        });
      } else {
        dataToSort.sort((a, b) => {
          if (sortBy.key === 'holders' && a.name === 'ICON') return 1;
          if (sortBy.key === 'holders' && b.name === 'ICON') return -1;
          if (a[sortBy.key] > b[sortBy.key]) return -1;
          if (a[sortBy.key] < b[sortBy.key]) return 1;
          return 0;
        });
      }
    } else {
      if (sortBy.key === 'apyTotal') {
        dataToSort.sort((a, b) => {
          if (a['feesApy'] + (a['balnApy'] || 0) * 2.5 < b['feesApy'] + (b['balnApy'] || 0) * 2.5) return -1;
          if (a['feesApy'] + (a['balnApy'] || 0) * 2.5 > b['feesApy'] + (b['balnApy'] || 0) * 2.5) return 1;
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
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
