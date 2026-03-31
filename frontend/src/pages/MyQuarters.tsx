import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useMyProfile, useUserBadges, useUploadHistory } from '@/api/hooks'
import { LevelRing } from '@/components/rpg/LevelRing'
import { XPBar } from '@/components/rpg/XPBar'
import { BadgeCard } from '@/components/rpg/BadgeCard'
import { formatNumber, formatDate, timeAgo } from '@/lib/format'
import { getCategoryLabel } from '@/lib/badges'
import { authFetch, apiFetch } from '@/api/client'
import type { ApiToken } from '@/api/types'
import {
  Shield, Award, ScrollText, Settings, Wifi, Bluetooth, Radio, Upload,
  Key, Plus, Trash2, Copy, CheckCircle, XCircle, Loader2, Clock,
} from 'lucide-react'

type Tab = 'overview' | 'badges' | 'uploads' | 'settings'

export function MyQuarters() {
  const [tab, setTab] = useState<Tab>('overview')
  const { user } = useAuthStore()
  const { data: profile } = useMyProfile(!!user)
  const { data: badges } = useUserBadges(user?.id)
  const { data: uploads } = useUploadHistory(50, 0, !!user)

  if (!user || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-secondary">
        <div className="text-center">
          <Shield size={40} className="mx-auto mb-3 text-muted" />
          <div className="font-display text-lg font-bold text-primary mb-1">Quarters Locked</div>
          <div className="text-xs">Login to access your personal quarters</div>
        </div>
      </div>
    )
  }

  const earnedCount = badges?.filter((b) => b.earned).length ?? 0
  const totalCount = badges?.length ?? 0
  const badgesByCategory = groupBy(badges ?? [], 'category')

  const userValues: Record<string, number> = {
    wifi_count: profile.wifi_discovered,
    bt_count: profile.bt_discovered,
    cell_count: profile.cell_discovered,
    upload_count: profile.total_uploads,
    xp: profile.xp,
    level: profile.level,
  }

  const tabs: Array<{ key: Tab; icon: React.ReactNode; label: string }> = [
    { key: 'overview', icon: <Shield size={12} />, label: 'Overview' },
    { key: 'badges', icon: <Award size={12} />, label: `Badges (${earnedCount}/${totalCount})` },
    { key: 'uploads', icon: <ScrollText size={12} />, label: 'Quest Log' },
    { key: 'settings', icon: <Settings size={12} />, label: 'Settings' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold mb-1">My Quarters</h1>
          <p className="text-xs text-secondary">Your personal command center</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all ${
                tab === t.key ? 'bg-gold/12 text-gold border border-gold/25' : 'text-secondary hover:text-primary border border-transparent'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="ornate-card rounded-xl p-5 sm:p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] to-transparent" />
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <LevelRing level={profile.level} xp={profile.xp} xpProgress={profile.xp_progress} size={140} avatarUrl={user.avatar_url} />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-display text-xl font-bold text-primary">{user.username}</h2>
                  {profile.global_rank > 0 && (
                    <div className="text-[10px] font-mono text-legendary mt-0.5">Global Rank #{profile.global_rank}</div>
                  )}
                  <div className="mt-3 max-w-xs mx-auto md:mx-0">
                    <XPBar xp={profile.xp} level={profile.level} xpProgress={profile.xp_progress} xpCurrent={profile.xp_current_level} xpNext={profile.xp_next_level} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatCard icon={<Wifi size={16} />} value={profile.wifi_discovered} label="WiFi" color="text-wifi" />
              <StatCard icon={<Bluetooth size={16} />} value={profile.bt_discovered} label="Bluetooth" color="text-bt" />
              <StatCard icon={<Radio size={16} />} value={profile.cell_discovered} label="Cell" color="text-cell" />
              <StatCard icon={<Upload size={16} />} value={profile.total_uploads} label="Uploads" color="text-xp" />
            </div>

            {earnedCount > 0 && (
              <div className="ornate-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-xs font-bold text-gold">Recent Badges</h3>
                  <button onClick={() => setTab('badges')} className="text-[10px] text-gold/70 hover:text-gold hover:underline">
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {badges?.filter((b) => b.earned).slice(-4).reverse().map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badges */}
        {tab === 'badges' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-legendary mb-0.5">
                {earnedCount} / {totalCount}
              </div>
              <div className="text-xs text-secondary">Badges Collected</div>
              <div className="w-40 h-1.5 bg-void/60 rounded-full overflow-hidden mx-auto mt-2 border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full"
                  style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-display font-bold uppercase tracking-[0.15em] text-gold/60">
                    {getCategoryLabel(category)}
                  </span>
                  <span className="text-[9px] font-mono text-muted">
                    {categoryBadges.filter((b) => b.earned).length}/{categoryBadges.length}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/10 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {categoryBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} showProgress currentValue={userValues[badge.criteria_type] ?? 0} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploads */}
        {tab === 'uploads' && (
          <div className="space-y-2">
            {!uploads || uploads.length === 0 ? (
              <div className="text-center py-12 text-secondary">
                <ScrollText size={36} className="mx-auto mb-3 text-muted" />
                <div className="font-display text-base font-bold text-primary mb-1">No Quests Yet</div>
                <div className="text-xs">Upload your first wardriving capture to begin</div>
              </div>
            ) : (
              uploads.map((tx) => (
                <div key={tx.id} className="ornate-card rounded-lg p-3 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <StatusIcon status={tx.status} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-semibold text-primary truncate">{tx.filename}</div>
                    <div className="text-[9px] text-muted mt-0.5">
                      {timeAgo(tx.uploaded_at)}
                      {tx.file_format && <span className="ml-1.5 text-muted/70">{tx.file_format}</span>}
                    </div>
                  </div>
                  {tx.status === 'done' && (
                    <div className="flex gap-3 text-right">
                      <MiniStat label="New" value={tx.new_networks} color="text-xp" />
                      <MiniStat label="Updated" value={tx.updated_networks} color="text-wifi" />
                      <MiniStat label="XP" value={tx.xp_earned} color="text-legendary" />
                    </div>
                  )}
                  {tx.status === 'error' && (
                    <span className="text-[10px] text-danger">{tx.status_message ?? 'Failed'}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function SettingsTab() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [newTokenName, setNewTokenName] = useState('')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadTokens = async () => {
    try {
      const res = await authFetch('/auth/tokens')
      if (res.ok) setTokens(await res.json())
    } catch {}
  }

  useEffect(() => { loadTokens() }, [])

  const createToken = async () => {
    if (!newTokenName.trim()) return
    setLoading(true)
    try {
      const data = await apiFetch<ApiToken>('/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName }),
      })
      setNewToken(data.token ?? null)
      setNewTokenName('')
      loadTokens()
    } catch {} finally { setLoading(false) }
  }

  const revokeToken = async (id: number) => {
    try {
      await authFetch(`/auth/tokens/${id}`, { method: 'DELETE' })
      loadTokens()
    } catch {}
  }

  return (
    <div className="ornate-card rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Key size={14} className="text-gold" />
        <h3 className="font-display text-xs font-bold text-gold">API Tokens</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gold/10 to-transparent" />
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={newTokenName}
          onChange={(e) => setNewTokenName(e.target.value)}
          placeholder="Token name..."
          className="flex-1 px-2.5 py-1.5 bg-void/50 border border-border rounded-md text-[11px] font-mono text-primary placeholder:text-muted focus:border-gold/40 focus:outline-none"
        />
        <button
          onClick={createToken}
          disabled={!newTokenName.trim() || loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold bg-gold/10 text-gold border border-gold/25 hover:bg-gold/20 disabled:opacity-25 transition-all"
        >
          <Plus size={12} /> Create
        </button>
      </div>

      {newToken && (
        <div className="bg-xp/5 border border-xp/20 rounded-lg p-2.5 mb-3">
          <div className="text-[9px] font-semibold text-xp mb-1">Copy now — won't be shown again!</div>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 font-mono text-[10px] text-primary bg-void/50 px-2 py-1 rounded break-all">{newToken}</code>
            <button onClick={() => navigator.clipboard.writeText(newToken)} className="p-1 text-muted hover:text-primary">
              <Copy size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {tokens.length === 0 ? (
          <div className="text-[10px] text-muted py-4 text-center">No API tokens yet</div>
        ) : (
          tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-void/30 rounded-md px-2.5 py-2 border border-border/50">
              <div>
                <div className={`text-[11px] font-semibold ${t.revoked ? 'text-muted line-through' : 'text-primary'}`}>{t.name}</div>
                <div className="text-[9px] text-muted">Created {formatDate(t.created_at)}</div>
              </div>
              {t.revoked ? (
                <span className="text-[9px] text-muted">Revoked</span>
              ) : (
                <button onClick={() => revokeToken(t.id)} className="text-danger/70 hover:text-danger transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="ornate-card rounded-xl p-3 text-center">
      <div className={`${color} mb-0.5 flex justify-center opacity-70`}>{icon}</div>
      <div className={`font-mono font-bold text-lg ${color}`}>{formatNumber(value)}</div>
      <div className="text-[9px] text-muted">{label}</div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'done': return <CheckCircle size={16} className="text-xp flex-shrink-0" />
    case 'error': return <XCircle size={16} className="text-danger flex-shrink-0" />
    case 'pending': return <Clock size={16} className="text-muted flex-shrink-0" />
    default: return <Loader2 size={16} className="text-wifi flex-shrink-0 animate-spin" />
  }
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`font-mono text-[10px] font-semibold ${color}`}>{formatNumber(value)}</div>
      <div className="text-[8px] text-muted">{label}</div>
    </div>
  )
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}
