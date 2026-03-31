import { useId } from 'react'
import { rankTitle, formatXP } from '@/lib/xp'

interface LevelRingProps {
  level: number
  xp: number
  xpProgress: number
  size?: number
  avatarUrl?: string | null
}

export function LevelRing({ level, xp, xpProgress, size = 140, avatarUrl }: LevelRingProps) {
  const gradientId = useId()
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, xpProgress))
  const center = size / 2
  const rank = rankTitle(level)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="absolute inset-0" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="6" opacity="0.5" />
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="animate-ring-fill"
            transform={`rotate(-90 ${center} ${center})`}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-gold-dim)" />
              <stop offset="100%" stopColor="var(--color-gold)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-[8px] rounded-full bg-surface border-2 border-border flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="font-display font-bold text-2xl text-gold">{level}</span>
          )}
        </div>

        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-dim to-gold text-void text-[11px] font-mono font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow-lg">
          Lvl {level}
        </div>
      </div>

      <div className="text-center mt-1">
        <div className="font-display font-bold text-[15px] text-gold">{rank.name}</div>
        <div className="text-[11px] text-secondary italic mt-0.5">{rank.flavor}</div>
        <div className="text-[12px] font-mono text-xp mt-1">{formatXP(xp)} XP</div>
      </div>
    </div>
  )
}
