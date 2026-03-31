import { useAuthStore } from '@/stores/authStore'
import { useMapStore } from '@/stores/mapStore'
import { useUIStore } from '@/stores/uiStore'
import { useMyProfile, useGlobalStats } from '@/api/hooks'
import { XPBar } from '@/components/rpg/XPBar'
import { formatNumber, encryptionColor } from '@/lib/format'
import { Wifi, Bluetooth, Radio, X, Search } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const { isAuthenticated } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const {
    mineOnly, toggleMineOnly, showBtLayer, toggleBtLayer,
    showCellLayer, toggleCellLayer, encryptionFilters, setEncryptionFilter,
  } = useMapStore()
  const { data: profile } = useMyProfile(isAuthenticated)
  const { data: stats } = useGlobalStats()
  const [ssidSearch, setSsidSearch] = useState('')
  const encryptions = ['WPA3', 'WPA2', 'WPA', 'WEP', 'Open', 'Unknown']

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        w-[300px] flex-shrink-0 bg-panel border-r border-border overflow-y-auto
        flex flex-col gap-3 p-3
        fixed top-14 bottom-0 z-40 transition-transform duration-300
        lg:relative lg:top-0 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden self-end p-2 rounded-lg text-secondary hover:text-gold transition-colors"
        >
          <X size={20} />
        </button>

        {/* Profile */}
        {isAuthenticated && profile && (
          <div className="parchment rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full border-2 border-gold/30" />
              )}
              <div className="min-w-0">
                <div className="font-semibold text-[14px] text-primary truncate">{profile.username}</div>
                <div className="text-[12px] text-gold font-display">{profile.rank}</div>
              </div>
            </div>
            <XPBar xp={profile.xp} level={profile.level} xpProgress={profile.xp_progress} xpCurrent={profile.xp_current_level} xpNext={profile.xp_next_level} />
          </div>
        )}

        {/* World stats */}
        {stats && (
          <div className="parchment rounded-lg p-4">
            <div className="section-title mb-3">World Status</div>
            <div className="grid grid-cols-3 gap-3">
              <StatBox icon={<Wifi size={16} />} value={stats.total_wifi} label="WiFi" color="text-wifi" />
              <StatBox icon={<Bluetooth size={16} />} value={stats.total_bt} label="BT" color="text-bt" />
              <StatBox icon={<Radio size={16} />} value={stats.total_cell} label="Cell" color="text-cell" />
            </div>
          </div>
        )}

        {/* Encryption */}
        <div className="parchment rounded-lg p-4">
          <div className="section-title mb-3">Encryption Filter</div>
          <div className="flex flex-col gap-2">
            {encryptions.map((enc) => (
              <label key={enc} className="flex items-center gap-2.5 text-[13px] cursor-pointer group">
                <input
                  type="checkbox"
                  checked={encryptionFilters[enc] ?? true}
                  onChange={(e) => setEncryptionFilter(enc, e.target.checked)}
                  className="w-4 h-4 accent-gold rounded"
                />
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: encryptionColor(enc) }} />
                <span className="text-secondary group-hover:text-primary transition-colors">{enc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Layers */}
        <div className="parchment rounded-lg p-4">
          <div className="section-title mb-3">Layers</div>
          <div className="flex flex-col gap-1.5">
            {isAuthenticated && <ToggleBtn active={mineOnly} onClick={toggleMineOnly} label="My Networks Only" />}
            <ToggleBtn active={showBtLayer} onClick={toggleBtLayer} label="Bluetooth Devices" />
            <ToggleBtn active={showCellLayer} onClick={toggleCellLayer} label="Cell Towers" />
          </div>
        </div>

        {/* SSID search */}
        <div className="parchment rounded-lg p-4">
          <div className="section-title mb-3">SSID Search</div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={ssidSearch}
              onChange={(e) => setSsidSearch(e.target.value)}
              placeholder="Search networks..."
              className="w-full pl-10 pr-3 py-2.5 bg-void/50 border border-border rounded-lg text-[13px] font-mono text-primary placeholder:text-muted focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Top SSIDs */}
        {stats?.top_ssids && stats.top_ssids.length > 0 && (
          <div className="parchment rounded-lg p-4">
            <div className="section-title mb-3">Top SSIDs</div>
            <div className="flex flex-col">
              {stats.top_ssids.slice(0, 8).map((s, i) => (
                <div key={i} className="flex justify-between items-center text-[13px] py-1.5 border-b border-border/30 last:border-0">
                  <span className="font-mono text-primary truncate max-w-[180px]">{s.ssid || '<hidden>'}</span>
                  <span className="font-mono text-muted flex-shrink-0 ml-3">{formatNumber(s.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

function StatBox({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`${color} mb-1 flex justify-center`}>{icon}</div>
      <div className={`font-mono font-bold text-[17px] ${color}`}>{formatNumber(value)}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}

function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
        active
          ? 'bg-gold/10 text-gold border border-gold/20'
          : 'text-secondary hover:text-primary hover:bg-surface border border-transparent'
      }`}
    >
      {label}
    </button>
  )
}
