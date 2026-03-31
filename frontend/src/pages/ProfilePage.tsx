import { useParams } from 'react-router-dom'
import { useUserProfile, useUserBadges } from '@/api/hooks'
import { LevelRing } from '@/components/rpg/LevelRing'
import { BadgeCard } from '@/components/rpg/BadgeCard'
import { formatNumber, formatDate } from '@/lib/format'
import { getCategoryLabel } from '@/lib/badges'
import { Wifi, Bluetooth, Radio, Upload, Calendar } from 'lucide-react'

export function ProfilePage() {
  const { userId } = useParams()
  const { data: profile, loading } = useUserProfile(userId)
  const { data: badges } = useUserBadges(profile?.user_id)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center text-secondary text-sm">
        Player not found
      </div>
    )
  }

  const earnedBadges = badges?.filter((b) => b.earned) ?? []
  const badgesByCategory = groupBy(badges ?? [], 'category')

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="ornate-card rounded-xl p-6 sm:p-8 mb-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] to-transparent" />
          <div className="relative">
            <LevelRing level={profile.level} xp={profile.xp} xpProgress={profile.xp_progress} size={130} avatarUrl={profile.avatar_url} />
            <h2 className="font-display text-xl font-bold text-primary mt-3">{profile.username}</h2>
            {profile.global_rank > 0 && (
              <div className="text-[10px] font-mono text-legendary mt-1">Global Rank #{profile.global_rank}</div>
            )}
            {profile.created_at && (
              <div className="flex items-center justify-center gap-1 text-[9px] text-muted mt-1.5">
                <Calendar size={9} /> Joined {formatDate(profile.created_at)}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <StatCard icon={<Wifi size={16} />} value={profile.wifi_discovered} label="WiFi" color="text-wifi" />
          <StatCard icon={<Bluetooth size={16} />} value={profile.bt_discovered} label="Bluetooth" color="text-bt" />
          <StatCard icon={<Radio size={16} />} value={profile.cell_discovered} label="Cell" color="text-cell" />
          <StatCard icon={<Upload size={16} />} value={profile.total_uploads} label="Uploads" color="text-xp" />
        </div>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <div className="ornate-card rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display font-bold text-sm text-gold">Trophy Room</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/10 to-transparent" />
              <span className="text-[9px] font-mono text-muted">{earnedBadges.length} earned</span>
            </div>
            {Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
              const earned = categoryBadges.filter((b) => b.earned)
              if (earned.length === 0) return null
              return (
                <div key={category} className="mb-5 last:mb-0">
                  <div className="text-[9px] font-display font-bold uppercase tracking-[0.15em] text-gold/60 mb-2">
                    {getCategoryLabel(category)}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {earned.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
                  </div>
                </div>
              )
            })}
          </div>
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

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}
