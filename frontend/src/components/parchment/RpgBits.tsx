import type { CSSProperties, ReactNode } from 'react'
import { ParchmentCard, WaxSeal } from './Primitives'
import { PlumeCrown } from '@/components/icons/PlumeIcons'
import { formatXP } from '@/lib/xp'
import { formatNumber } from '@/lib/format'

// ────────────────────────────────────────────────────────────────
// LevelRingParchment — 140px XP ring with central level number
// ────────────────────────────────────────────────────────────────
export function LevelRingParchment({
  level,
  xpProgress,
  size = 140,
  rank,
}: {
  level: number
  xpProgress: number // 0..1
  size?: number
  rank?: string
}) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, xpProgress))
  const offset = c * (1 - clamped)
  return (
    <div style={{ position: 'relative', width: size, height: size + (rank ? 18 : 0), margin: '0 auto' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-wax-red)"
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="butt"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r - 6}
          fill="var(--color-parchment-light)"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: `0 0 ${rank ? 18 : 0}px 0`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          className="font-display"
          style={{
            fontSize: 10,
            letterSpacing: '0.15em',
            color: 'var(--color-sepia)',
            fontWeight: 700,
          }}
        >
          LEVEL
        </div>
        <div
          className="font-display"
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: 'var(--color-wax-red)',
            lineHeight: 1,
          }}
        >
          {level}
        </div>
      </div>
      {rank && (
        <div
          className="font-display"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-sepia)',
          }}
        >
          {rank}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// PodiumCard — top-3 leaderboard card with wax seal rank
// ────────────────────────────────────────────────────────────────
export function PodiumCard({
  rank,
  height,
  username,
  value,
  level,
  valueLabel,
  guild,
  crown,
}: {
  rank: 1 | 2 | 3
  height: number
  username: string
  value: ReactNode
  level?: number
  valueLabel: string
  guild?: string
  crown?: boolean
}) {
  const medals: Record<1 | 2 | 3, string> = {
    1: '#b8860b',
    2: '#8a8a8a',
    3: '#8b5a2b',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {crown && (
        <div style={{ color: '#b8860b', marginBottom: -4 }}>
          <PlumeCrown size={40} />
        </div>
      )}
      <ParchmentCard
        padding="34px 18px 18px"
        style={{ minHeight: height, position: 'relative', width: '100%' }}
      >
        <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)' }}>
          <WaxSeal label={String(rank)} size={40} rotate={-5} />
        </div>
        <div
          className="font-display"
          style={{
            fontSize: rank === 1 ? 20 : 16,
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--color-ink)',
            letterSpacing: '0.06em',
          }}
        >
          {username}
        </div>
        {guild && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-sepia)',
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: 2,
            }}
          >
            {guild}
          </div>
        )}
        <div
          style={{
            borderTop: '1px dotted rgba(26,20,16,0.3)',
            marginTop: 14,
            paddingTop: 12,
            textAlign: 'center',
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: rank === 1 ? 26 : 20,
              fontWeight: 700,
              color: medals[rank],
            }}
          >
            {value}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: 9,
              letterSpacing: '0.18em',
              color: 'var(--color-sepia)',
              textTransform: 'uppercase',
              marginTop: 3,
            }}
          >
            {valueLabel}
          </div>
          {level !== undefined && (
            <div
              className="font-mono"
              style={{ fontSize: 10, color: 'var(--color-sepia)', marginTop: 6 }}
            >
              Level {level}
            </div>
          )}
        </div>
      </ParchmentCard>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// ParchmentPieChart — custom SVG donut, no external lib
// ────────────────────────────────────────────────────────────────
export function ParchmentPieChart({
  data,
  size = 180,
  centerLabel = 'TOTAL',
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  size?: number
  centerLabel?: string
  centerValue?: ReactNode
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6

  let acc = 0
  const paths = data.map((d) => {
    const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2
    acc += d.value
    const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = d.value / total > 0.5 ? 1 : 0
    const path = `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    return { ...d, path }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p) => (
        <path
          key={p.name}
          d={p.path}
          fill={p.color}
          stroke="var(--color-parchment-light)"
          strokeWidth="1.5"
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.42}
        fill="var(--color-parchment-light)"
        stroke="var(--color-ink)"
        strokeWidth="1.2"
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontFamily="Cinzel"
        fontWeight={700}
        fontSize={10}
        letterSpacing={1}
        fill="var(--color-wax-red)"
      >
        {centerLabel}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fontFamily="JetBrains Mono"
        fontWeight={700}
        fontSize={12}
        fill="var(--color-ink)"
      >
        {centerValue ?? formatNumber(total)}
      </text>
    </svg>
  )
}

// ────────────────────────────────────────────────────────────────
// HorizontalBar — ranked list with a sepia progress bar
// ────────────────────────────────────────────────────────────────
export function HorizontalBar({
  label,
  value,
  max,
  suffix,
  labelStyle,
}: {
  label: ReactNode
  value: number
  max: number
  suffix?: string
  labelStyle?: CSSProperties
}) {
  const pct = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          marginBottom: 4,
          ...labelStyle,
        }}
      >
        <span style={{ color: 'var(--color-ink)' }}>{label}</span>
        <span className="font-mono" style={{ color: 'var(--color-sepia)' }}>
          {formatNumber(value)}
          {suffix ? ` ${suffix}` : ''}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--color-parchment-dark)',
          border: '1px solid var(--color-ink)',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--color-sepia)',
          }}
        />
      </div>
    </div>
  )
}

export function XpShimmerBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(100, progress * 100))
  return (
    <div
      style={{
        height: 8,
        border: '1px solid var(--color-ink)',
        background: 'var(--color-parchment-dark)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="animate-xp-shimmer"
        style={{
          width: `${pct}%`,
          height: '100%',
          background:
            'linear-gradient(90deg, var(--color-gold-tarnish), var(--color-gold) 30%, var(--color-gold-tarnish))',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}

export function formatRankValue(v: number, mode: 'xp' | 'count') {
  return mode === 'xp' ? formatXP(v) : formatNumber(v)
}
