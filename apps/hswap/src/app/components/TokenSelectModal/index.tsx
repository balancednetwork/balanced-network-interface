import { Modal } from '@/app/components/Modal';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRatesWithOracle } from '@/queries/reward';
import { formatPrice } from '@/utils/formatter';
import { xChainMap, xChains } from '@balancednetwork/xwagmi';
import { allXTokens } from '@balancednetwork/xwagmi';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogo from '../CurrencyLogo';
import { SearchGradientIcon, SubtractIcon } from '../Icons';
import XChainSelect from '../XChainSelect';

const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'asset',
    header: 'Asset',
    filterFn: (row, columnId, filterValue) => {
      const xTokens = row.original as XToken[];
      return xTokens[0].symbol.toLowerCase().includes(filterValue.toLowerCase());
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
  },
];

const DEFAULT_XCHAIN_ID = 'all';

export const UNTRADEABLE_TOKENS = ['tBTC', 'weETH', 'wstETH', 'HASUI', 'AFSUI', 'VSUI', 'JITOSOL', 'aARCH'];

export function TokenSelectModal({ open, onDismiss, account, onCurrencySelect, selectedCurrency }) {
  const [xChainId, setXChainId] = useState<XChainId | 'all'>(DEFAULT_XCHAIN_ID);

  const rates = useRatesWithOracle();

  // TODO: hide aARCH token temporarily
  const filteredXTokens = useMemo(() => {
    if (xChainId === 'all') {
      return allXTokens.filter(x => !UNTRADEABLE_TOKENS.includes(x.symbol));
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
    <Modal
      open={open}
      onDismiss={onDismiss}
      className="bg-[#D4C5F9]/30 backdrop-blur-[50px] border-none"
      dialogClassName="max-w-[350px] h-[625px] pt-16"
    >
      <div className="flex flex-col gap-2 justify-between items-center">
        <XChainSelect xChains={xChains} value={xChainId} onValueChange={value => setXChainId(value)} />

        <div className="bg-[#D4C5F9] rounded-full relative flex justify-between items-center pl-4 pr-6 py-2 gap-2 w-[187px] mb-2">
          <SearchGradientIcon className="h-6 w-6" />
          <Input
            placeholder="Search tokens..."
            className={cn(
              'bg-transparent !placeholder-[#0d0229] text-[#0d0229] text-sm font-medium leading-tight p-0 h-8',
              'border-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
            )}
            value={(table.getColumn('asset')?.getFilterValue() as string) ?? ''}
            onChange={event => table.getColumn('asset')?.setFilterValue(event.target.value)}
          />
          {/* <ChevronDownGradientIcon /> */}
        </div>

        <ScrollArea className="h-[400px] border-none w-full px-2 py-2">
          <div className="flex flex-col gap-2 justify-center items-center">
            <div className="flex flex-col gap-2">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => {
                  const xTokens = row.original as XToken[];
                  const price = rates?.[xTokens?.[0].symbol];

                  return (
                    <div key={row.id}>
                      <div
                        className={cn(
                          'flex justify-start items-center gap-2 py-2 cursor-default rounded-xl px-16 w-full',
                          xChainId !== 'all' ? 'cursor-pointer' : '',
                        )}
                        onClick={() => {
                          if (xChainId !== 'all') {
                            onCurrencySelect(xTokens?.[0]);
                            onDismiss();
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CurrencyLogo currency={xTokens?.[0]} className="" />
                          <div className="text-[#e6e0f7] text-sm font-bold leading-tight">{xTokens?.[0].symbol}</div>
                        </div>
                        <div className="text-[#d4c5f9] text-sm font-medium leading-tight">
                          {price && formatPrice(price.toString())}
                        </div>
                      </div>
                      {xChainId === 'all' && (
                        <div className="flex flex-col gap-2 justify-center items-center">
                          <div className="relative flex justify-center flex-wrap gap-2 w-[270px] bg-[#d4c5f9]/30 rounded-3xl py-4 px-4">
                            <div className="absolute top-[-8px] left-[50%] mx-[-16px]">
                              <SubtractIcon className="w-8 h-2 fill-[#d4c5f9]/30" />
                            </div>

                            {xTokens.map((xToken: XToken) => (
                              <div
                                key={xToken.xChainId}
                                className="cursor-pointer"
                                onClick={() => {
                                  onCurrencySelect(xToken);
                                  onDismiss();
                                }}
                              >
                                <ChainLogo chain={xChainMap[xToken.xChainId]} className="hover:bg-white" />
                              </div>
                            ))}
                          </div>
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
