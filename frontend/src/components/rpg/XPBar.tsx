import { formatXP } from '@/lib/xp'

interface XPBarProps {
  xp: number
  level: number
  xpProgress: number
  xpCurrent: number
  xpNext: number
  compact?: boolean
}

export function XPBar({ xp, level, xpProgress, xpCurrent, xpNext, compact }: XPBarProps) {
  const pct = Math.min(100, Math.max(0, xpProgress * 100))

  if (compact) {
    return (
      <div className="h-2 bg-void/50 rounded-full overflow-hidden border border-border/50">
        <div className="h-full rounded-full bg-gradient-to-r from-xp/60 to-xp" style={{ width: `${pct}%`, transition: 'width 0.7s ease' }} />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-display text-[13px] font-bold text-legendary">Level {level}</span>
        <span className="font-mono text-[11px] text-secondary">{formatXP(xp)} / {formatXP(xpNext)} XP</span>
      </div>
      <div className="h-3 bg-void/50 rounded-full overflow-hidden border border-border/50">
        <div className="h-full rounded-full relative overflow-hidden" style={{ width: `${pct}%`, transition: 'width 0.7s ease' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-xp/70 to-xp" />
          <div className="absolute inset-0 animate-xp-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', backgroundSize: '200% 100%' }} />
        </div>
      </div>
      <div className="text-right mt-1">
        <span className="font-mono text-[10px] text-muted">{formatXP(xpNext - xp)} XP to next level</span>
      </div>
    </div>
  )
}
