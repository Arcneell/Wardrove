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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-gold">Arena Rankings</h1>
          <p className="text-[14px] text-secondary mt-1">The greatest wardrivers across all realms</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[{ key: 'xp', icon: <Star size={16} />, label: 'By XP' }, { key: 'wifi', icon: <Wifi size={16} />, label: 'By WiFi' }].map((s) => (
            <button key={s.key} onClick={() => setSortBy(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                sortBy === s.key ? 'bg-gold/10 text-gold border border-gold/20' : 'text-secondary hover:text-primary border border-transparent'
              }`}
            >{s.icon} {s.label}</button>
          ))}
        </div>

        {top3.length >= 3 && (
          <div className="hidden sm:flex items-end justify-center gap-4 mb-10">
            <PodiumCard entry={top3[1]} position={2} />
            <PodiumCard entry={top3[0]} position={1} />
            <PodiumCard entry={top3[2]} position={3} />
          </div>
        )}

        <div className="parchment rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-secondary">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
              Loading rankings...
            </div>
          ) : (
            rest.map((entry, i) => (
              <motion.div key={entry.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border/40 hover:bg-surface/30 transition-colors"
              >
                <span className="font-mono font-bold text-[13px] text-muted w-8 text-right">#{entry.rank}</span>
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt="" className="w-9 h-9 rounded-full border border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-[13px] font-bold text-secondary">
                    {entry.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${entry.user_id}`} className="font-semibold text-[14px] text-primary hover:text-gold transition-colors">
                    {entry.username}
                  </Link>
                  <div className="text-[11px] text-muted font-display">{rankTitle(entry.level).name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-[13px] text-legendary">Lvl {entry.level}</div>
                  <div className="font-mono text-[11px] text-xp">{formatXP(entry.xp)}</div>
                </div>
                <div className="hidden md:flex gap-5 text-right flex-shrink-0">
                  <Stat label="WiFi" value={entry.wifi_discovered} color="text-wifi" />
                  <Stat label="BT" value={entry.bt_discovered} color="text-bt" />
                  <Stat label="Cell" value={entry.cell_discovered} color="text-cell" />
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
    1: { h: 'h-40', border: 'border-gold/50', bg: 'bg-gold/5', text: 'text-gold', icon: <Crown size={22} /> },
    2: { h: 'h-32', border: 'border-[#c0c0c0]/40', bg: 'bg-[#c0c0c0]/5', text: 'text-[#c0c0c0]', icon: <Medal size={20} /> },
    3: { h: 'h-28', border: 'border-[#cd7f32]/40', bg: 'bg-[#cd7f32]/5', text: 'text-[#cd7f32]', icon: <Award size={20} /> },
  }[position]!

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: position * 0.12 }}
      className={`flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}`}
    >
      <div className={`${cfg.text} mb-2`}>{cfg.icon}</div>
      {entry.avatar_url ? (
        <img src={entry.avatar_url} alt="" className={`w-14 h-14 rounded-full border-2 ${cfg.border} mb-2`} />
      ) : (
        <div className={`w-14 h-14 rounded-full bg-surface border-2 ${cfg.border} mb-2 flex items-center justify-center font-bold text-lg text-secondary`}>
          {entry.username[0].toUpperCase()}
        </div>
      )}
      <Link to={`/profile/${entry.user_id}`} className="font-semibold text-[14px] text-primary hover:text-gold transition-colors">{entry.username}</Link>
      <div className={`text-[12px] font-mono font-bold ${cfg.text}`}>Lvl {entry.level}</div>
      <div className="text-[11px] font-mono text-xp">{formatXP(entry.xp)}</div>
      <div className={`${cfg.h} w-20 ${cfg.bg} border ${cfg.border} rounded-t-lg mt-3 flex items-end justify-center pb-2`}>
        <span className={`font-display font-bold text-2xl ${cfg.text}`}>#{position}</span>
      </div>
    </motion.div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`font-mono text-[12px] font-semibold ${color}`}>{formatNumber(value)}</div>
      <div className="text-[10px] text-muted">{label}</div>
    </div>
  )
}
