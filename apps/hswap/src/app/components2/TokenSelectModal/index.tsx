import * as React from 'react';
import { useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import { XToken } from '@balancednetwork/sdk-core';
import { Modal } from '@/app/components2/Modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import CurrencyLogo from '../CurrencyLogo';
import { ChainLogo } from '../ChainLogo';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { Input } from '@/components/ui/input';
import { useRatesWithOracle } from '@/queries/reward';
import { formatPrice } from '@/utils/formatter';

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'asset',
    header: 'Asset',
    filterFn: (row, columnId, filterValue) => {
      const xTokens = row.original as XToken[];
      return (
        xTokens[0].symbol.toLowerCase().includes(filterValue.toLowerCase()) ||
        xTokens.some(xToken => xChainMap[xToken.xChainId].name.toLowerCase().includes(filterValue.toLowerCase()))
      );
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
  },
];

export function TokenSelectModal({ open, onDismiss, account, onCurrencySelect, selectedCurrency }) {
  const rates = useRatesWithOracle();

  // TODO: hide aARCH token temporarily
  const allTokens = useMemo(() => {
    return allXTokens.filter(token => token.symbol !== 'aARCH');
  }, []);

  // group allTokens by symbol
  const groupedXTokens = useMemo(() => {
    return Object.values(
      allTokens.reduce((grouped, token) => {
        if (!grouped[token.symbol]) {
          grouped[token.symbol] = [];
        }

        grouped[token.symbol].push(token);
        return grouped;
      }, {}),
    );
  }, [allTokens]);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: groupedXTokens,
    // @ts-ignore
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <Modal open={open} onDismiss={onDismiss} hideCloseIcon={true} dialogClassName="max-w-[450px]">
      <div className="flex flex-col gap-4">
        <div className="bg-[#221542] rounded-xl relative">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Search tokens..."
            className="pl-10 border-none bg-transparent text-primary-foreground !text-subtitle"
            value={(table.getColumn('asset')?.getFilterValue() as string) ?? ''}
            onChange={event => table.getColumn('asset')?.setFilterValue(event.target.value)}
          />
        </div>

        <ScrollArea className="h-[500px] border-none p-2 m-[-4px]">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <div>Asset</div>
              <div>Price</div>
            </div>
            <div className="flex flex-col gap-2">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => {
                  const xTokens = row.original as XToken[];
                  const price = rates?.[xTokens?.[0].symbol];

                  return (
                    <div key={row.id}>
                      <div
                        className="flex justify-between py-2 cursor-pointer"
                        onClick={() => {
                          onCurrencySelect(xTokens?.[0]);
                          onDismiss();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CurrencyLogo currency={xTokens?.[0]} />
                          <span>{xTokens?.[0].symbol}</span>
                        </div>
                        <div>{price && formatPrice(price.toString())}</div>
                      </div>
                      <div className="relative flex gap-2 bg-[#221542] p-2 rounded-xl">
                        <div className="absolute left-[48px] transform -translate-x-1/2 top-[-10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-[#221542]"></div>

                        {xTokens.map((xToken: XToken) => (
                          <div
                            key={xToken.xChainId}
                            className="cursor-pointer"
                            onClick={() => {
                              onCurrencySelect(xToken);
                              onDismiss();
                            }}
                          >
                            <ChainLogo chain={xChainMap[xToken.xChainId]} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-24 text-center">No assets.</div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </Modal>
  );
}
