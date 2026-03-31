import { useAuthStore } from '@/stores/authStore'
import { useMapStore } from '@/stores/mapStore'
import { useUIStore } from '@/stores/uiStore'
import { useMyProfile, useGlobalStats } from '@/api/hooks'
import { XPBar } from '@/components/rpg/XPBar'
import { formatNumber, encryptionColor } from '@/lib/format'
import {
  Wifi, Bluetooth, Radio, X, Search,
} from 'lucide-react'
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        w-72 xl:w-80 flex-shrink-0 bg-panel/95 backdrop-blur-sm border-r border-border overflow-y-auto
        flex flex-col gap-2 p-2.5
        fixed top-12 bottom-0 z-40 transition-transform duration-300
        lg:relative lg:top-0 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden self-end p-1.5 rounded-md text-secondary hover:text-gold hover:bg-surface transition-all"
        >
          <X size={16} />
        </button>

        {/* Profile card */}
        {isAuthenticated && profile && (
          <div className="ornate-card rounded-lg p-3">
            <div className="flex items-center gap-2.5 mb-2.5">
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full border-2 border-gold/30" />
              )}
              <div className="min-w-0">
                <div className="font-mono font-bold text-sm text-primary truncate">{profile.username}</div>
                <div className="text-[10px] text-gold font-display font-semibold">{profile.rank}</div>
              </div>
            </div>
            <XPBar
              xp={profile.xp}
              level={profile.level}
              xpProgress={profile.xp_progress}
              xpCurrent={profile.xp_current_level}
              xpNext={profile.xp_next_level}
            />
          </div>
        )}

        {/* Global stats */}
        {stats && (
          <div className="ornate-card rounded-lg p-3">
            <SectionTitle label="World Status" />
            <div className="grid grid-cols-3 gap-2">
              <StatBox icon={<Wifi size={13} />} value={stats.total_wifi} label="WiFi" color="text-wifi" />
              <StatBox icon={<Bluetooth size={13} />} value={stats.total_bt} label="BT" color="text-bt" />
              <StatBox icon={<Radio size={13} />} value={stats.total_cell} label="Cell" color="text-cell" />
            </div>
          </div>
        )}

        {/* Encryption filters */}
        <div className="ornate-card rounded-lg p-3">
          <SectionTitle label="Encryption Filter" />
          <div className="flex flex-col gap-1.5">
            {encryptions.map((enc) => (
              <label key={enc} className="flex items-center gap-2 text-[11px] cursor-pointer group py-0.5">
                <input
                  type="checkbox"
                  checked={encryptionFilters[enc] ?? true}
                  onChange={(e) => setEncryptionFilter(enc, e.target.checked)}
                  className="accent-gold rounded"
                />
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: encryptionColor(enc) }}
                />
                <span className="text-secondary group-hover:text-primary transition-colors">{enc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Layer toggles */}
        <div className="ornate-card rounded-lg p-3">
          <SectionTitle label="Layers" />
          <div className="flex flex-col gap-1">
            {isAuthenticated && (
              <ToggleButton active={mineOnly} onClick={toggleMineOnly} label="My Networks Only" />
            )}
            <ToggleButton active={showBtLayer} onClick={toggleBtLayer} label="Bluetooth Devices" />
            <ToggleButton active={showCellLayer} onClick={toggleCellLayer} label="Cell Towers" />
          </div>
        </div>

        {/* SSID search */}
        <div className="ornate-card rounded-lg p-3">
          <SectionTitle label="SSID Search" />
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={ssidSearch}
              onChange={(e) => setSsidSearch(e.target.value)}
              placeholder="Search networks..."
              className="w-full pl-8 pr-3 py-1.5 bg-void/50 border border-border rounded-md text-[11px] font-mono text-primary placeholder:text-muted focus:border-gold/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Top SSIDs */}
        {stats?.top_ssids && stats.top_ssids.length > 0 && (
          <div className="ornate-card rounded-lg p-3">
            <SectionTitle label="Top SSIDs" />
            <div className="flex flex-col">
              {stats.top_ssids.slice(0, 8).map((s, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] py-1 border-b border-border/30 last:border-0">
                  <span className="font-mono text-primary truncate max-w-[160px]">{s.ssid || '<hidden>'}</span>
                  <span className="font-mono text-muted flex-shrink-0 ml-2">{formatNumber(s.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[9px] font-display font-bold uppercase tracking-[0.15em] text-gold/70">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-gold/15 to-transparent" />
    </div>
  )
}

function StatBox({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="text-center py-1">
      <div className={`${color} mb-0.5 flex justify-center opacity-70`}>{icon}</div>
      <div className={`font-mono font-bold text-sm ${color}`}>{formatNumber(value)}</div>
      <div className="text-[9px] text-muted">{label}</div>
    </div>
  )
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
        active
          ? 'bg-gold/10 text-gold border border-gold/20'
          : 'text-secondary hover:text-primary hover:bg-surface border border-transparent'
      }`}
    >
      {label}
    </button>
  )
}
