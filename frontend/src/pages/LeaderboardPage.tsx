import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLeaderboard } from '@/api/hooks'
import { Trophy, Wifi, Star, Crown, Medal, Award } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { rankTitle, formatXP } from '@/lib/xp'

export function LeaderboardPage() {
  const [sortBy, setSortBy] = useState('xp')
  const { data: entries, loading } = useLeaderboard(sortBy, 100)

  const top3 = entries?.slice(0, 3) ?? []
  const rest = entries?.slice(3) ?? []

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold mb-1">Arena Rankings</h1>
          <p className="text-xs text-secondary">The greatest wardrivers across all realms</p>
        </div>

        {/* Sort tabs */}
        <div className="flex justify-center gap-1.5 mb-6">
          {[
            { key: 'xp', icon: <Star size={13} />, label: 'By XP' },
            { key: 'wifi', icon: <Wifi size={13} />, label: 'By WiFi' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                sortBy === s.key ? 'bg-gold/12 text-gold border border-gold/25' : 'text-secondary hover:text-primary border border-transparent'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Podium — hidden on mobile */}
        {top3.length >= 3 && (
          <div className="hidden sm:flex items-end justify-center gap-3 mb-8">
            <PodiumCard entry={top3[1]} position={2} />
            <PodiumCard entry={top3[0]} position={1} />
            <PodiumCard entry={top3[2]} position={3} />
          </div>
        )}

        {/* Rankings */}
        <div className="ornate-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-secondary">
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading rankings...</span>
            </div>
          ) : (
            rest.map((entry, i) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015 }}
                className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-border/40 hover:bg-surface/40 transition-colors"
              >
                <span className="font-mono font-bold text-[11px] text-muted w-7 text-right">
                  #{entry.rank}
                </span>
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className="w-7 h-7 rounded-full border border-border" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-secondary">
                    {entry.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${entry.user_id}`} className="font-semibold text-xs text-primary hover:text-gold transition-colors">
                    {entry.username}
                  </Link>
                  <div className="text-[9px] text-muted font-display">{rankTitle(entry.level).name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-[11px] text-legendary">Lvl {entry.level}</div>
                  <div className="font-mono text-[9px] text-xp">{formatXP(entry.xp)}</div>
                </div>
                <div className="hidden sm:flex gap-3 text-right flex-shrink-0">
                  <MiniStat value={entry.wifi_discovered} color="text-wifi" />
                  <MiniStat value={entry.bt_discovered} color="text-bt" />
                  <MiniStat value={entry.cell_discovered} color="text-cell" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function PodiumCard({ entry, position }: { entry: any; position: number }) {
  const cfg = {
    1: { h: 'h-36', border: 'border-gold/50', bg: 'bg-gold/5', text: 'text-gold', icon: <Crown size={18} /> },
    2: { h: 'h-28', border: 'border-[#c0c0c0]/40', bg: 'bg-[#c0c0c0]/5', text: 'text-[#c0c0c0]', icon: <Medal size={16} /> },
    3: { h: 'h-24', border: 'border-[#cd7f32]/40', bg: 'bg-[#cd7f32]/5', text: 'text-[#cd7f32]', icon: <Award size={16} /> },
  }[position]!

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.12 }}
      className={`flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}`}
    >
      <div className={`${cfg.text} mb-1.5`}>{cfg.icon}</div>
      {entry.avatar_url ? (
        <img src={entry.avatar_url} alt="" className={`w-12 h-12 rounded-full border-2 ${cfg.border} mb-1.5`} />
      ) : (
        <div className={`w-12 h-12 rounded-full bg-surface border-2 ${cfg.border} mb-1.5 flex items-center justify-center font-bold text-sm text-secondary`}>
          {entry.username[0].toUpperCase()}
        </div>
      )}
      <Link to={`/profile/${entry.user_id}`} className="font-semibold text-xs text-primary hover:text-gold transition-colors mb-0.5">
        {entry.username}
      </Link>
      <div className={`text-[10px] font-mono font-bold ${cfg.text}`}>Lvl {entry.level}</div>
      <div className="text-[9px] font-mono text-xp">{formatXP(entry.xp)}</div>
      <div className={`${cfg.h} w-16 ${cfg.bg} border ${cfg.border} rounded-t-lg mt-2 flex items-end justify-center pb-1.5`}>
        <span className={`font-display font-bold text-xl ${cfg.text}`}>#{position}</span>
      </div>
    </motion.div>
  )
}

function MiniStat({ value, color }: { value: number; color: string }) {
  return (
    <span className={`font-mono text-[10px] font-semibold ${color}`}>{formatNumber(value)}</span>
  )
}
