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

export function DataTable<T>({ columns, data, loading, emptyMessage = 'No data found', page, totalPages, onPageChange }: DataTableProps<T>) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}
                  className={`sticky top-0 bg-surface/95 backdrop-blur-sm px-4 py-3 text-left section-title border-b border-border ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-secondary">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-[13px]">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-muted text-[14px]">{emptyMessage}</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-surface/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-[13px] ${col.className ?? ''}`}>{col.render(row, i)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages != null && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-3 py-3 border-t border-border bg-surface/50">
          <button onClick={() => onPageChange(Math.max(0, (page ?? 0) - 1))} disabled={!page}
            className="p-1.5 rounded text-secondary hover:text-primary disabled:opacity-20 transition-colors"><ChevronLeft size={18} /></button>
          <span className="text-[12px] font-mono text-muted">Page {(page ?? 0) + 1} of {totalPages}</span>
          <button onClick={() => onPageChange((page ?? 0) + 1)} disabled={(page ?? 0) >= totalPages - 1}
            className="p-1.5 rounded text-secondary hover:text-primary disabled:opacity-20 transition-colors"><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  )
}
