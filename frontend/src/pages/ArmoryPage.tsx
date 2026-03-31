import { useState } from 'react'
import { useBtDevices, useCellTowers } from '@/api/hooks'
import { DataTable } from '@/components/ui/DataTable'
import { Bluetooth, Radio, Search } from 'lucide-react'
import { formatNumber, timeAgo } from '@/lib/format'
import type { BtDevice, CellTower } from '@/api/types'

type Tab = 'bluetooth' | 'cell'

export function ArmoryPage() {
  const [tab, setTab] = useState<Tab>('bluetooth')
  const [btPage, setBtPage] = useState(0)
  const [cellPage, setCellPage] = useState(0)
  const [btSearch, setBtSearch] = useState('')
  const [cellRadio, setCellRadio] = useState('')

  const { data: btData, loading: btLoading } = useBtDevices(btPage * 50, 50, btSearch)
  const { data: cellData, loading: cellLoading } = useCellTowers(cellPage * 50, 50, cellRadio)

  const btColumns = [
    { key: 'name', label: 'Device', render: (r: BtDevice) => (
      <div>
        <div className={`font-semibold text-xs ${r.name ? 'text-primary' : 'text-muted italic'}`}>
          {r.name || '<unknown>'}
        </div>
        <div className="font-mono text-[9px] text-muted">{r.mac}</div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: BtDevice) => (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
        r.device_type === 'BLE' ? 'bg-xp/8 text-xp' : 'bg-bt/8 text-bt'
      }`}>
        {r.device_type}
      </span>
    )},
    { key: 'rssi', label: 'Signal', render: (r: BtDevice) => (
      <span className="font-mono text-[10px] text-secondary">{r.rssi ? `${r.rssi} dBm` : '—'}</span>
    )},
    { key: 'coords', label: 'Location', className: 'hidden sm:table-cell', render: (r: BtDevice) => (
      <span className="font-mono text-[9px] text-muted">
        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
      </span>
    )},
    { key: 'seen', label: 'Last Seen', render: (r: BtDevice) => (
      <span className="text-[10px] text-muted">{timeAgo(r.last_seen)}</span>
    )},
  ]

  const cellColumns = [
    { key: 'radio', label: 'Radio', render: (r: CellTower) => (
      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cell/8 text-cell">
        {r.radio}
      </span>
    )},
    { key: 'identity', label: 'Identity', render: (r: CellTower) => (
      <div>
        <div className="font-mono text-[10px] text-primary">MCC {r.mcc} / MNC {r.mnc}</div>
        <div className="font-mono text-[9px] text-muted">LAC {r.lac} / CID {r.cid}</div>
      </div>
    )},
    { key: 'rssi', label: 'Signal', render: (r: CellTower) => (
      <span className="font-mono text-[10px] text-secondary">{r.rssi ? `${r.rssi} dBm` : '—'}</span>
    )},
    { key: 'coords', label: 'Location', className: 'hidden sm:table-cell', render: (r: CellTower) => (
      <span className="font-mono text-[9px] text-muted">
        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
      </span>
    )},
    { key: 'seen', label: 'Last Seen', render: (r: CellTower) => (
      <span className="text-[10px] text-muted">{timeAgo(r.last_seen)}</span>
    )},
  ]

  const radios = ['', 'GSM', 'LTE', 'WCDMA', 'CDMA', 'NR']

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 sm:px-6 pt-4 pb-3 flex-shrink-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gold mb-0.5">The Armory</h1>
        <p className="text-[11px] text-secondary">Your collection of captured devices and towers</p>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="flex gap-0.5 ornate-card rounded-lg p-0.5">
            <TabBtn active={tab === 'bluetooth'} onClick={() => setTab('bluetooth')} icon={<Bluetooth size={12} />} label="Bluetooth" count={btData?.total} />
            <TabBtn active={tab === 'cell'} onClick={() => setTab('cell')} icon={<Radio size={12} />} label="Cell Towers" count={cellData?.total} />
          </div>

          {tab === 'bluetooth' && (
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={btSearch}
                onChange={(e) => { setBtSearch(e.target.value); setBtPage(0) }}
                placeholder="Search devices..."
                className="pl-7 pr-3 py-1.5 bg-surface border border-border rounded-lg text-[10px] font-mono text-primary placeholder:text-muted focus:border-gold/40 focus:outline-none transition-colors"
              />
            </div>
          )}

          {tab === 'cell' && (
            <div className="flex gap-0.5 flex-wrap">
              {radios.map((r) => (
                <button
                  key={r}
                  onClick={() => { setCellRadio(r); setCellPage(0) }}
                  className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                    cellRadio === r ? 'bg-cell/12 text-cell border border-cell/25' : 'text-muted hover:text-primary border border-transparent'
                  }`}
                >
                  {r || 'All'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="h-full ornate-card rounded-xl overflow-hidden flex flex-col">
          {tab === 'bluetooth' ? (
            <DataTable
              columns={btColumns}
              data={btData?.results ?? []}
              loading={btLoading}
              emptyMessage="No Bluetooth devices found yet. Upload some captures!"
              page={btPage}
              totalPages={Math.ceil((btData?.total ?? 0) / 50)}
              onPageChange={setBtPage}
            />
          ) : (
            <DataTable
              columns={cellColumns}
              data={cellData?.results ?? []}
              loading={cellLoading}
              emptyMessage="No cell towers found yet. Upload some captures!"
              page={cellPage}
              totalPages={Math.ceil((cellData?.total ?? 0) / 50)}
              onPageChange={setCellPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
        active ? 'bg-gold/12 text-gold' : 'text-secondary hover:text-primary'
      }`}
    >
      {icon} {label}
      {count != null && <span className="font-mono text-[9px] opacity-50">{formatNumber(count)}</span>}
    </button>
  )
}
