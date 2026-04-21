import { useState } from 'react'
import { useBtDevices, useCellTowers } from '@/api/hooks'
import { SearchField } from '@/components/ui/SearchField'
import { formatNumber, timeAgo } from '@/lib/format'
import { PageHeader, ParchmentCard, RibbonTabs, InkPill } from '@/components/parchment/Primitives'
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

  const radios = ['', 'GSM', 'LTE', 'WCDMA', 'CDMA', 'NR']

  const btRows = btData?.results ?? []
  const cellRows = cellData?.results ?? []
  const btTotalPages = Math.max(1, Math.ceil((btData?.total ?? 0) / 50))
  const cellTotalPages = Math.max(1, Math.ceil((cellData?.total ?? 0) / 50))
  const loading = tab === 'bluetooth' ? btLoading : cellLoading
  const page = tab === 'bluetooth' ? btPage : cellPage
  const totalPages = tab === 'bluetooth' ? btTotalPages : cellTotalPages
  const setPage = tab === 'bluetooth' ? setBtPage : setCellPage
  const totalForTab = tab === 'bluetooth' ? btData?.total ?? 0 : cellData?.total ?? 0

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: 'var(--page-pad-y) var(--page-pad-x)',
      }}
    >
      <PageHeader
        title="The Armory"
        subtitle="Inventory of captured bluetooth wraiths and charted towers"
      />

      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <RibbonTabs<Tab>
          tabs={[
            { id: 'bluetooth', label: `Bluetooth (${formatNumber(btData?.total ?? 0)})` },
            { id: 'cell', label: `Cell Towers (${formatNumber(cellData?.total ?? 0)})` },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 16 }}>
        {tab === 'bluetooth' ? (
          <div style={{ width: 420, maxWidth: '100%' }}>
            <SearchField
              value={btSearch}
              onChange={(v) => {
                setBtSearch(v)
                setBtPage(0)
              }}
              placeholder="Search by name or MAC…"
              ariaLabel="Search Bluetooth devices"
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {radios.map((r) => (
              <button
                key={r || 'all'}
                type="button"
                onClick={() => {
                  setCellRadio(r)
                  setCellPage(0)
                }}
                className={`btn-parchment ${cellRadio === r ? 'active' : ''}`}
                aria-pressed={cellRadio === r}
                style={{ padding: '6px 12px', fontSize: 11 }}
              >
                {r || 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ParchmentCard padding={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                color: 'var(--color-sepia)',
                fontStyle: 'italic',
                fontSize: 14,
              }}
            >
              The scouts have not yet returned…
            </div>
          ) : tab === 'bluetooth' ? (
            btRows.length === 0 ? (
              <Empty message="No bluetooth wraiths in these lands yet." />
            ) : (
              <ArmoryTable>
                <thead>
                  <HeaderRow
                    cols={['Device', 'MAC', 'Type', 'RSSI', 'Sightings', 'Last seen']}
                  />
                </thead>
                <tbody>
                  {btRows.map((r, i) => (
                    <BtRow key={`${r.mac}-${r.last_seen}`} row={r} zebra={i % 2 === 1} />
                  ))}
                </tbody>
              </ArmoryTable>
            )
          ) : cellRows.length === 0 ? (
            <Empty message="No towers recorded yet." />
          ) : (
            <ArmoryTable>
              <thead>
                <HeaderRow
                  cols={['Operator', 'MCC/MNC', 'LAC/CID', 'RAT', 'RSSI', 'Last seen']}
                />
              </thead>
              <tbody>
                {cellRows.map((r, i) => (
                  <CellRow
                    key={`${r.mcc}-${r.mnc}-${r.lac}-${r.cid}`}
                    row={r}
                    zebra={i % 2 === 1}
                  />
                ))}
              </tbody>
            </ArmoryTable>
          )}

          {totalPages > 1 && !loading && (
            <footer
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: '10px 16px',
                borderTop: '2px solid var(--color-ink)',
                background: 'var(--color-parchment-dark)',
              }}
            >
              <button
                type="button"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-parchment"
                style={{ padding: '4px 10px' }}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span
                className="font-mono"
                style={{ fontSize: 11, color: 'var(--color-sepia)' }}
              >
                Folio {page + 1} of {totalPages} · {formatNumber(totalForTab)} entries
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="btn-parchment"
                style={{ padding: '4px 10px' }}
                aria-label="Next page"
              >
                ›
              </button>
            </footer>
          )}
        </ParchmentCard>
      </div>
    </div>
  )
}

function ArmoryTable({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        {children}
      </table>
    </div>
  )
}

function HeaderRow({ cols }: { cols: string[] }) {
  return (
    <tr
      style={{
        background: 'var(--color-parchment-dark)',
        borderBottom: '2px solid var(--color-ink)',
      }}
    >
      {cols.map((c) => (
        <th
          key={c}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-wax-red)',
            padding: '12px 16px',
            textAlign: 'left',
            position: 'sticky',
            top: 0,
            background: 'var(--color-parchment-dark)',
          }}
        >
          {c}
        </th>
      ))}
    </tr>
  )
}

function BtRow({ row, zebra }: { row: BtDevice; zebra: boolean }) {
  return (
    <tr
      style={{
        background: zebra ? 'rgba(139, 69, 19, 0.05)' : 'transparent',
        borderBottom: '1px dotted rgba(26, 20, 16, 0.25)',
      }}
    >
      <Td>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            color: row.name ? 'var(--color-ink)' : 'var(--color-sepia-muted)',
            fontStyle: row.name ? 'normal' : 'italic',
          }}
        >
          {row.name || '<unknown>'}
        </span>
      </Td>
      <Td>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-sepia)' }}>
          {row.mac}
        </span>
      </Td>
      <Td>
        <InkPill>{row.device_type}</InkPill>
      </Td>
      <Td>
        <span className="font-mono" style={{ color: 'var(--color-ink)' }}>
          {row.rssi != null ? `${row.rssi} dBm` : '—'}
        </span>
      </Td>
      <Td>
        <span className="font-mono" style={{ color: 'var(--color-sepia)' }}>
          {formatNumber(row.seen_count ?? 0)}
        </span>
      </Td>
      <Td>
        <span style={{ fontSize: 11, color: 'var(--color-sepia)', fontStyle: 'italic' }}>
          {timeAgo(row.last_seen)}
        </span>
      </Td>
    </tr>
  )
}

function CellRow({ row, zebra }: { row: CellTower; zebra: boolean }) {
  return (
    <tr
      style={{
        background: zebra ? 'rgba(139, 69, 19, 0.05)' : 'transparent',
        borderBottom: '1px dotted rgba(26, 20, 16, 0.25)',
      }}
    >
      <Td>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            color: 'var(--color-ink)',
          }}
        >
          {row.radio}
        </span>
      </Td>
      <Td>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-sepia)' }}>
          {row.mcc}/{row.mnc}
        </span>
      </Td>
      <Td>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-sepia)' }}>
          {row.lac}/{row.cid}
        </span>
      </Td>
      <Td>
        <InkPill>{row.radio}</InkPill>
      </Td>
      <Td>
        <span className="font-mono" style={{ color: 'var(--color-ink)' }}>
          {row.rssi != null ? `${row.rssi} dBm` : '—'}
        </span>
      </Td>
      <Td>
        <span style={{ fontSize: 11, color: 'var(--color-sepia)', fontStyle: 'italic' }}>
          {timeAgo(row.last_seen)}
        </span>
      </Td>
    </tr>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>{children}</td>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: 'var(--color-sepia)',
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 14,
        textAlign: 'center',
      }}
    >
      {message}
    </div>
  )
}
