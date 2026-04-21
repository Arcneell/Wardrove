import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useMapStore } from '@/stores/mapStore'
import { useMyProfile, useGlobalStats } from '@/api/hooks'
import { formatNumber, encryptionColor } from '@/lib/format'
import { SearchField } from '@/components/ui/SearchField'
import { PanelTitle, ParchmentCard } from '@/components/parchment/Primitives'
import { LevelRingParchment, XpShimmerBar } from '@/components/parchment/RpgBits'
import { PlumeWifi, PlumeBluetooth, PlumeRadio } from '@/components/icons/PlumeIcons'
import { rankTitle } from '@/lib/xp'
import type { ReactNode } from 'react'

export function Sidebar() {
  const { isAuthenticated } = useAuthStore()
  const {
    mineOnly,
    toggleMineOnly,
    showBtLayer,
    toggleBtLayer,
    showCellLayer,
    toggleCellLayer,
    encryptionFilters,
    setEncryptionFilter,
  } = useMapStore()
  const { data: profile } = useMyProfile(isAuthenticated)
  const { data: stats } = useGlobalStats()
  const [ssidSearch, setSsidSearch] = useState('')
  const encryptions = ['WPA3', 'WPA2', 'WPA', 'WEP', 'Open', 'Unknown']

  return (
    <aside
      id="map-tools-sidebar"
      aria-label="Map tools and filters"
      className="sidebar-root"
      style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 16,
        background:
          'linear-gradient(180deg, rgba(232,220,192,0.45) 0%, rgba(217,201,163,0.45) 100%)',
        borderRight: '2px solid var(--color-ink)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2
          className="font-display"
          style={{
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: '0.22em',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          THEATRE OF OPERATIONS
        </h2>
        <div style={{ fontStyle: 'italic', fontSize: 11, color: 'var(--color-sepia)' }}>
          drawn by the scout's own hand
        </div>
      </div>

      {isAuthenticated && profile && (
        <Panel title="Your Seal">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <LevelRingParchment
              level={profile.level}
              xpProgress={profile.xp_progress ?? 0}
              size={110}
            />
            <div style={{ textAlign: 'center' }}>
              <div
                className="font-display"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  letterSpacing: '0.08em',
                }}
              >
                {profile.username}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontStyle: 'italic',
                  color: 'var(--color-sepia)',
                }}
              >
                {profile.rank ?? rankTitle(profile.level).name}
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <XpShimmerBar progress={profile.xp_progress ?? 0} />
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--color-sepia)',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {formatNumber(profile.xp)} XP
              </div>
            </div>
          </div>
        </Panel>
      )}

      {stats && (
        <Panel title="World Tally">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <TallyStat
              icon={<PlumeWifi size={22} color="var(--color-layer-wifi)" />}
              value={stats.total_wifi}
              label="WiFi"
              color="var(--color-layer-wifi)"
            />
            <TallyStat
              icon={<PlumeBluetooth size={22} color="var(--color-layer-bt)" />}
              value={stats.total_bt}
              label="BT"
              color="var(--color-layer-bt)"
            />
            <TallyStat
              icon={<PlumeRadio size={22} color="var(--color-layer-cell)" />}
              value={stats.total_cell}
              label="Cell"
              color="var(--color-layer-cell)"
            />
          </div>
        </Panel>
      )}

      <Panel title="Encryption Sigils">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {encryptions.map((enc) => {
            const checked = encryptionFilters[enc] ?? true
            return (
              <label
                key={enc}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setEncryptionFilter(enc, e.target.checked)}
                  style={{
                    width: 14,
                    height: 14,
                    accentColor: 'var(--color-wax-red)',
                    border: '2px solid var(--color-ink)',
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: encryptionColor(enc),
                    border: '1px solid var(--color-ink)',
                  }}
                />
                <span style={{ color: checked ? 'var(--color-ink)' : 'var(--color-sepia-muted)' }}>
                  {enc}
                </span>
              </label>
            )
          })}
        </div>
      </Panel>

      <Panel title="Layers">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {isAuthenticated && (
            <LayerToggle active={mineOnly} onClick={toggleMineOnly} label="My networks only" />
          )}
          <LayerToggle active={showBtLayer} onClick={toggleBtLayer} label="Bluetooth devices" />
          <LayerToggle active={showCellLayer} onClick={toggleCellLayer} label="Cell towers" />
        </div>
      </Panel>

      <Panel title="SSID Search">
        <SearchField
          value={ssidSearch}
          onChange={setSsidSearch}
          placeholder="Network name..."
        />
      </Panel>

      {stats?.top_ssids && stats.top_ssids.length > 0 && (
        <Panel title="Most Sighted">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.top_ssids.slice(0, 8).map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom:
                    i < stats.top_ssids.length - 1
                      ? '1px dotted rgba(26,20,16,0.2)'
                      : 'none',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span
                  style={{
                    color: 'var(--color-ink)',
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.ssid || '<hidden>'}
                </span>
                <span style={{ color: 'var(--color-sepia)' }}>
                  {formatNumber(s.count)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </aside>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ParchmentCard raw padding={14}>
      <div style={{ marginBottom: 10 }}>
        <PanelTitle>{title}</PanelTitle>
      </div>
      {children}
    </ParchmentCard>
  )
}

function TallyStat({
  icon,
  value,
  label,
  color,
}: {
  icon: ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span
        className="font-mono"
        style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}
      >
        {formatNumber(value)}
      </span>
      <span
        className="font-display"
        style={{
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'var(--color-sepia)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function LayerToggle({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '6px 10px',
        fontSize: 11,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.08em',
        background: active ? 'var(--color-parchment-dark)' : 'transparent',
        color: active ? 'var(--color-wax-red)' : 'var(--color-sepia)',
        border: active ? '1.5px solid var(--color-ink)' : '1.5px solid transparent',
        boxShadow: active ? '2px 2px 0 0 rgba(26,20,16,0.85)' : 'none',
        cursor: 'pointer',
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      {label}
    </button>
  )
}
