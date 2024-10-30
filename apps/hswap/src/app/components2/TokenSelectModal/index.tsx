import * as React from 'react';
import { useMemo, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import { Modal } from '@/app/components2/Modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import CurrencyLogo from '../CurrencyLogo';
import { ChainLogo } from '../ChainLogo';
import { xChainMap, xChains } from '@/xwagmi/constants/xChains';
import { Input } from '@/components/ui/input';
import { useRatesWithOracle } from '@/queries/reward';
import { formatPrice } from '@/utils/formatter';
import { XChainId, XToken } from '@/xwagmi/types';
import XChainSelect from '../XChainSelect';
import { cn } from '@/lib/utils';

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
  const [xChainId, setXChainId] = useState<XChainId | 'all'>('0x1.icon');

  const rates = useRatesWithOracle();

  // TODO: hide aARCH token temporarily
  const filteredXTokens = useMemo(() => {
    if (xChainId === 'all') {
      return allXTokens.filter(x => x.symbol !== 'aARCH');
    }

    return allXTokens.filter(x => x.symbol !== 'aARCH' && x.xChainId === xChainId);
  }, [xChainId]);

  // group allTokens by symbol
  const groupedXTokens = useMemo(() => {
    return Object.values(
      filteredXTokens.reduce((grouped, token) => {
        if (!grouped[token.symbol]) {
          grouped[token.symbol] = [];
        }

        grouped[token.symbol].push(token);
        return grouped;
      }, {}),
    );
  }, [filteredXTokens]);

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
        <div className="bg-[#221542] rounded-xl relative flex justify-between items-center px-2 py-1">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Search tokens..."
            className={cn(
              'pl-10 bg-transparent text-primary-foreground !text-subtitle',
              'border-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
            )}
            value={(table.getColumn('asset')?.getFilterValue() as string) ?? ''}
            onChange={event => table.getColumn('asset')?.setFilterValue(event.target.value)}
          />
          <XChainSelect xChains={xChains} value={xChainId} onValueChange={value => setXChainId(value)} />
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
                      {xChainId === 'all' && (
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
                      )}
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
