import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const defaultValue = (row, column) => {
    if (column.value) return column.value(row);
    return row[column.key];
};

const DataTable = ({
    columns,
    data,
    rowKey = 'id',
    loading = false,
    emptyText,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 20],
    searchable = true,
    showPageSize = true,
    showPagination = true,
}) => {
    const { t, language } = useLanguage();
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState({ key: null, direction: 'asc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const processedRows = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase(language);
        const filtered = normalizedQuery
            ? data.filter((row) => columns.some((column) => {
                if (column.searchable === false) return false;
                const value = defaultValue(row, column);
                return String(value ?? '').toLocaleLowerCase(language).includes(normalizedQuery);
            }))
            : data;

        if (!sort.key) return filtered;
        const column = columns.find((item) => (item.key || item.id) === sort.key);
        if (!column) return filtered;

        const collator = new Intl.Collator(language, { numeric: true, sensitivity: 'base' });
        return [...filtered].sort((a, b) => {
            const first = column.sortValue ? column.sortValue(a) : defaultValue(a, column);
            const second = column.sortValue ? column.sortValue(b) : defaultValue(b, column);
            const result = typeof first === 'number' && typeof second === 'number'
                ? first - second
                : collator.compare(String(first ?? ''), String(second ?? ''));
            return sort.direction === 'asc' ? result : -result;
        });
    }, [columns, data, language, query, sort]);

    const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const visibleRows = processedRows.slice(startIndex, startIndex + pageSize);
    const endIndex = Math.min(startIndex + visibleRows.length, processedRows.length);

    const handleSort = (column) => {
        if (column.sortable === false) return;
        const key = column.key || column.id;
        setSort((current) => current.key === key
            ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
            : { key, direction: 'asc' });
        setPage(1);
    };

    return (
        <div className="w-full max-w-full overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white/95 shadow-md shadow-slate-200/40">
            {(searchable || showPageSize) && (
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                {searchable ? (
                    <label className="relative block w-full max-w-md">
                        <span className="sr-only">{t('tableSearch')}</span>
                        <Search
                            size={18}
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="search"
                            className="form-input h-11 bg-white text-sm shadow-sm"
                            style={{ paddingLeft: '2.75rem' }}
                            placeholder={t('tableSearch')}
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>
                ) : <span />}

                {showPageSize && <label className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-medium text-slate-600">
                    <span>{t('rowsPerPage')}</span>
                    <select
                        className="form-select h-11 min-w-24 bg-white py-2 shadow-sm"
                        style={{ width: '6rem' }}
                        value={pageSize}
                        onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setPage(1);
                        }}
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </label>}
            </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="border-b border-slate-300 bg-slate-100">
                        <tr>
                            {columns.map((column) => {
                                const key = column.key || column.id;
                                const active = sort.key === key;
                                return (
                                    <th
                                        key={key}
                                        className={`whitespace-nowrap px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700 ${column.className || ''}`}
                                        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        {column.sortable === false ? (
                                            column.label
                                        ) : (
                                            <button
                                                type="button"
                                                className="group inline-flex items-center gap-1.5 transition hover:text-slate-900"
                                                onClick={() => handleSort(column)}
                                            >
                                                {column.label}
                                                {active
                                                    ? (sort.direction === 'asc'
                                                        ? <ChevronUp size={14} aria-hidden="true" />
                                                        : <ChevronDown size={14} aria-hidden="true" />)
                                                    : <ArrowUpDown size={13} aria-hidden="true" className="text-slate-400 opacity-60 group-hover:opacity-100" />}
                                            </button>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                                    {t('loading')}
                                </td>
                            </tr>
                        ) : visibleRows.length ? (
                            visibleRows.map((row, index) => (
                                <tr
                                    key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
                                    className={`${(startIndex + index) % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'} transition-colors hover:bg-indigo-50/70`}
                                >
                                    {columns.map((column) => {
                                        const key = column.key || column.id;
                                        return (
                                            <td key={key} className={`px-5 py-4 align-middle text-sm leading-6 text-slate-700 ${key === 'actions' ? 'whitespace-nowrap' : ''} ${column.cellClassName || ''}`}>
                                                {column.render
                                                    ? column.render(row, startIndex + index)
                                                    : String(defaultValue(row, column) ?? '—')}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-slate-500">
                                    {emptyText || t('noResults')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showPagination && (
            <div className="flex flex-col gap-3 border-t border-slate-300 bg-slate-50/70 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">
                    {processedRows.length
                        ? t('showingRows')
                            .replace('{from}', startIndex + 1)
                            .replace('{to}', endIndex)
                            .replace('{total}', processedRows.length)
                        : t('showingRows')
                            .replace('{from}', 0)
                            .replace('{to}', 0)
                            .replace('{total}', 0)}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                        aria-label={t('previousPage')}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="min-w-16 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center font-semibold text-slate-700">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(currentPage + 1)}
                        aria-label={t('nextPage')}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            )}
        </div>
    );
};

export default DataTable;
