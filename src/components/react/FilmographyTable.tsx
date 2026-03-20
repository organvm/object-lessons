import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';

interface FilmScene {
  description: string;
  symbolic_category: string;
  tier: number;
}

interface FilmData {
  id: string;
  title: string;
  year: number;
  director: string;
  scenes: FilmScene[];
  letterboxd_url?: string;
  imdb_id?: string;
}

interface FilmographyTableProps {
  films: FilmData[];
  objectFilter?: string;
}

const columnHelper = createColumnHelper<FilmData>();

export default function FilmographyTable({ films, objectFilter }: FilmographyTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'year', desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    films.forEach(f => f.scenes.forEach(s => cats.add(s.symbolic_category)));
    return Array.from(cats).sort();
  }, [films]);

  const filteredFilms = useMemo(() => {
    if (!categoryFilter) return films;
    return films.filter(f => f.scenes.some(s => s.symbolic_category === categoryFilter));
  }, [films, categoryFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: info => {
          const film = info.row.original;
          const url = film.letterboxd_url ?? (film.imdb_id ? `https://www.imdb.com/title/${film.imdb_id}/` : undefined);
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline font-medium"
            >
              {info.getValue()}
            </a>
          ) : (
            <span className="font-medium text-primary">{info.getValue()}</span>
          );
        },
        enableSorting: true,
      }),
      columnHelper.accessor('year', {
        header: 'Year',
        cell: info => <span className="font-mono text-sm text-secondary">{info.getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('director', {
        header: 'Director',
        cell: info => <span className="text-primary text-sm">{info.getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor(
        row => row.scenes[0]?.symbolic_category ?? '',
        {
          id: 'category',
          header: 'Category',
          cell: info => (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded border border-divider text-secondary bg-data-bg">
              {info.getValue().replace(/-/g, ' ')}
            </span>
          ),
          enableSorting: true,
        }
      ),
      columnHelper.accessor(
        row => row.scenes[0]?.tier ?? 3,
        {
          id: 'tier',
          header: 'Tier',
          cell: info => {
            const tier = info.getValue() as number;
            const label = tier === 1 ? 'Landmark' : tier === 2 ? 'Significant' : 'Notable';
            const color =
              tier === 1
                ? 'text-accent border-accent'
                : tier === 2
                  ? 'text-secondary border-divider'
                  : 'text-secondary border-divider opacity-60';
            return (
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${color}`}>
                T{tier} {label}
              </span>
            );
          },
          enableSorting: true,
        }
      ),
    ],
    []
  );

  const table = useReactTable({
    data: filteredFilms,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const sortIndicator = (canSort: boolean, isSorted: false | 'asc' | 'desc') => {
    if (!canSort) return null;
    if (isSorted === 'asc') return <span aria-hidden="true" className="ml-1 text-accent">↑</span>;
    if (isSorted === 'desc') return <span aria-hidden="true" className="ml-1 text-accent">↓</span>;
    return <span aria-hidden="true" className="ml-1 text-divider">↕</span>;
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p className="text-sm text-secondary font-sans">
          {filteredFilms.length} film{filteredFilms.length !== 1 ? 's' : ''}
          {objectFilter ? ` featuring ${objectFilter}` : ''}
          {categoryFilter ? ` in "${categoryFilter.replace(/-/g, ' ')}"` : ''}
        </p>
        {allCategories.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-xs text-secondary font-sans uppercase tracking-widest">
              Filter:
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm text-primary bg-surface border border-divider rounded px-2 py-1 font-sans focus:outline-none focus:border-accent"
            >
              <option value="">All categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table — scrollable on mobile */}
      <div className="overflow-x-auto rounded border border-divider">
        <table className="w-full text-sm border-collapse" role="grid">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-data-bg border-b border-divider">
                {headerGroup.headers.map(header => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        isSorted === 'asc'
                          ? 'ascending'
                          : isSorted === 'desc'
                            ? 'descending'
                            : header.column.getCanSort()
                              ? 'none'
                              : undefined
                      }
                      className={`px-4 py-3 text-left text-xs font-sans font-semibold uppercase tracking-widest text-secondary whitespace-nowrap ${
                        header.column.getCanSort()
                          ? 'cursor-pointer select-none hover:text-primary transition-colors'
                          : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          header.column.getToggleSortingHandler()?.(e);
                        }
                      }}
                      tabIndex={header.column.getCanSort() ? 0 : undefined}
                    >
                      <span className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortIndicator(header.column.getCanSort(), isSorted)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-secondary text-sm">
                  No films match the selected filter.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-divider last:border-0 transition-colors hover:bg-data-bg ${
                    i % 2 === 0 ? '' : 'bg-data-bg/30'
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
