import { motion } from 'framer-motion'
import type { Badge } from '@/api/types'
import { getTierStyle } from '@/lib/badges'
import { formatNumber } from '@/lib/format'
import { PlumeIcon, PlumeLock, type PlumeIconKey } from '@/components/icons/PlumeIcons'

interface BadgeCardProps {
  badge: Badge
  showProgress?: boolean
  currentValue?: number
}

const CATEGORY_TO_PLUME: Record<string, PlumeIconKey> = {
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  cell: 'radio',
  upload: 'upload',
  xp: 'flame',
  level: 'sword',
  special: 'crown',
  meta: 'globe',
}

function resolvePlumeKey(badge: Badge): PlumeIconKey {
  const raw = (badge as { icon?: string }).icon
  if (raw && typeof raw === 'string') {
    const k = raw.toLowerCase() as PlumeIconKey
    if (['wifi', 'map', 'shield', 'crown', 'bluetooth', 'radio', 'upload', 'flame', 'lock', 'sword', 'globe'].includes(k)) {
      return k
    }
  }
  return CATEGORY_TO_PLUME[badge.category] || 'shield'
}

export function BadgeCard({ badge, showProgress, currentValue }: BadgeCardProps) {
  const tier = getTierStyle(badge.tier)
  const earned = badge.earned

  const progress =
    showProgress && currentValue != null
      ? Math.min(1, currentValue / badge.criteria_value)
      : undefined

  const plume = resolvePlumeKey(badge)

  const tierCssName = tier.name as
    | 'common'
    | 'uncommon'
    | 'rare'
    | 'epic'
    | 'legendary'
    | 'mythic'

  return (
    <motion.article
      whileHover={earned ? { y: -4 } : undefined}
      transition={{ duration: 0.15 }}
      className={`parchment-card tier-${tierCssName}`}
      style={{
        padding: 20,
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: earned ? 1 : 0.58,
        filter: earned ? 'none' : 'grayscale(0.7)',
      }}
      aria-label={`${badge.name} — ${tier.label}${earned ? ', earned' : ', locked'}`}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-display)',
          padding: '2px 6px',
          border: '1px solid var(--tier-color, var(--color-ink))',
          color: 'var(--tier-color, var(--color-ink))',
          background: 'var(--color-parchment-light)',
        }}
      >
        {tier.label}
      </div>

      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: '3px double var(--tier-color, var(--color-ink))',
          background: 'radial-gradient(circle at 35% 30%, #faf0d9, var(--color-parchment-dark))',
          boxShadow: earned
            ? '0 0 12px -2px var(--tier-color, var(--color-ink)), var(--shadow-stamp)'
            : 'var(--shadow-stamp)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '6px auto 0',
          color: 'var(--tier-color, var(--color-sepia))',
        }}
      >
        {earned ? (
          <PlumeIcon name={plume} size={52} color="var(--tier-color, var(--color-sepia))" />
        ) : (
          <PlumeLock size={36} color="var(--color-sepia-muted)" />
        )}
      </div>

      <h3
        className="font-display"
        style={{
          fontSize: 13,
          fontWeight: 700,
          margin: 0,
          color: earned ? 'var(--tier-color, var(--color-ink))' : 'var(--color-sepia)',
          letterSpacing: '0.04em',
        }}
      >
        {badge.name}
      </h3>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--color-sepia)',
          margin: 0,
          lineHeight: 1.45,
        }}
      >
        {badge.description}
      </p>

      {progress !== undefined && !earned && (
        <div>
          <div
            style={{
              height: 4,
              border: '1px solid var(--color-ink)',
              background: 'var(--color-parchment)',
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: 'var(--color-sepia)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <p
            className="font-mono"
            style={{ fontSize: 9, color: 'var(--color-sepia)', marginTop: 4 }}
          >
            {formatNumber(currentValue ?? 0)} / {formatNumber(badge.criteria_value)}
          </p>
        </div>
      )}

      {earned && badge.earned_at && (
        <p
          className="font-mono"
          style={{
            fontSize: 9,
            fontStyle: 'italic',
            color: 'var(--color-sepia)',
            marginTop: 'auto',
            paddingTop: 6,
            borderTop: '1px dotted rgba(26,20,16,0.25)',
          }}
        >
          Inscribed {new Date(badge.earned_at).toLocaleDateString()}
        </p>
      )}
    </motion.article>
  )
}
