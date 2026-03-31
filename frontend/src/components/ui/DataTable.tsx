import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: string
  label: string
  render: (row: T, index: number) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T>({
  columns, data, loading, emptyMessage = 'No data found',
  page, totalPages, onPageChange,
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`sticky top-0 bg-surface/95 backdrop-blur-sm px-3 py-2 text-left text-[9px] font-display font-bold uppercase tracking-[0.12em] text-gold/60 border-b border-border ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-secondary">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-[11px]">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-muted text-[11px]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 ${col.className ?? ''}`}>
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages != null && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2 py-2 border-t border-border bg-surface/50">
          <button
            onClick={() => onPageChange(Math.max(0, (page ?? 0) - 1))}
            disabled={!page}
            className="p-1 rounded text-secondary hover:text-primary disabled:opacity-20 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] font-mono text-muted">
            {(page ?? 0) + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange((page ?? 0) + 1)}
            disabled={(page ?? 0) >= totalPages - 1}
            className="p-1 rounded text-secondary hover:text-primary disabled:opacity-20 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
