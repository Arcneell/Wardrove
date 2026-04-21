import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLeaderboard } from '@/api/hooks'
import { formatNumber } from '@/lib/format'
import { rankTitle, formatXP } from '@/lib/xp'
import { useAuthStore } from '@/stores/authStore'
import { PageHeader, ParchmentCard, WaxSeal } from '@/components/parchment/Primitives'
import { PodiumCard } from '@/components/parchment/RpgBits'
import type { LeaderboardEntry } from '@/api/types'

type SortMode = 'xp' | 'wifi'

export function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<SortMode>('xp')
  const { data: entries, loading } = useLeaderboard(sortBy, 100)
  const { user } = useAuthStore()
  const list = entries ?? []
  const top3 = list.slice(0, 3)
  const rest = list.slice(3)

  const valueOf = (entry: LeaderboardEntry) =>
    sortBy === 'xp' ? entry.xp : entry.wifi_discovered ?? 0
  const valueLabel = sortBy === 'xp' ? 'Experience' : 'Networks'

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 'var(--page-pad-y) var(--page-pad-x)',
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto', width: '100%' }}>
        <PageHeader
          title="The Arena"
          subtitle="Names etched in ink, ranked by renown or networks sighted"
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 32,
          }}
        >
          {(['xp', 'wifi'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={`btn-parchment ${sortBy === key ? 'active' : ''}`}
              aria-pressed={sortBy === key}
            >
              {key === 'xp' ? 'By Experience' : 'By Networks'}
            </button>
          ))}
        </div>

        {loading ? (
          <ParchmentCard padding={40} style={{ textAlign: 'center' }}>
            <div
              className="font-body"
              style={{ fontStyle: 'italic', color: 'var(--color-sepia)' }}
            >
              Reading the rolls…
            </div>
          </ParchmentCard>
        ) : list.length === 0 ? (
          <ParchmentCard padding={40} style={{ textAlign: 'center' }}>
            <div
              className="font-body"
              style={{ fontStyle: 'italic', color: 'var(--color-sepia)' }}
            >
              No heralds have yet registered their names.
            </div>
          </ParchmentCard>
        ) : (
          <>
            {top3.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: top3.length === 3 ? '1fr 1.15fr 1fr' : `repeat(${top3.length}, 1fr)`,
                  gap: 20,
                  alignItems: 'end',
                  marginBottom: 40,
                  maxWidth: 820,
                  marginInline: 'auto',
                }}
              >
                {top3.length >= 2 && (
                  <PodiumCard
                    rank={2}
                    height={170}
                    username={top3[1].username}
                    value={sortBy === 'xp' ? formatXP(top3[1].xp) : formatNumber(valueOf(top3[1]))}
                    valueLabel={valueLabel}
                    level={top3[1].level}
                  />
                )}
                <PodiumCard
                  rank={1}
                  height={210}
                  username={top3[0].username}
                  value={sortBy === 'xp' ? formatXP(top3[0].xp) : formatNumber(valueOf(top3[0]))}
                  valueLabel={valueLabel}
                  level={top3[0].level}
                  crown
                />
                {top3.length >= 3 && (
                  <PodiumCard
                    rank={3}
                    height={150}
                    username={top3[2].username}
                    value={sortBy === 'xp' ? formatXP(top3[2].xp) : formatNumber(valueOf(top3[2]))}
                    valueLabel={valueLabel}
                    level={top3[2].level}
                  />
                )}
              </div>
            )}

            <ParchmentCard padding={0}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--color-parchment-dark)',
                      borderBottom: '2px solid var(--color-ink)',
                    }}
                  >
                    {['Rank', 'Herald', 'Rank Title', 'Level', 'XP', 'WiFi', 'BT', 'Cell'].map(
                      (label) => (
                        <th
                          key={label}
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'var(--color-wax-red)',
                            padding: '12px 14px',
                            textAlign: 'left',
                          }}
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry, i) => {
                    const isMe = user?.id === entry.user_id
                    return (
                      <motion.tr
                        key={entry.user_id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 20) * 0.015 }}
                        style={{
                          background: isMe
                            ? 'rgba(139, 26, 26, 0.12)'
                            : i % 2 === 1
                              ? 'rgba(139, 69, 19, 0.05)'
                              : 'transparent',
                          borderBottom: '1px dotted rgba(26, 20, 16, 0.25)',
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <WaxSeal label={String(entry.rank)} size={30} rotate={-3} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <Link
                            to={`/profile/${entry.user_id}`}
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 700,
                              fontSize: 13,
                              color: 'var(--color-ink)',
                              letterSpacing: '0.04em',
                              textDecoration: 'none',
                            }}
                          >
                            {entry.username}
                          </Link>
                        </td>
                        <td
                          style={{
                            padding: '10px 14px',
                            fontSize: 11,
                            fontStyle: 'italic',
                            color: 'var(--color-sepia)',
                          }}
                        >
                          {rankTitle(entry.level).name}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            className="font-mono"
                            style={{ color: 'var(--color-gold-tarnish)', fontWeight: 700 }}
                          >
                            {entry.level}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-ink)' }}>
                            {formatXP(entry.xp)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-layer-wifi)' }}>
                            {formatNumber(entry.wifi_discovered ?? 0)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-layer-bt)' }}>
                            {formatNumber(entry.bt_discovered ?? 0)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-layer-cell)' }}>
                            {formatNumber(entry.cell_discovered ?? 0)}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </ParchmentCard>
          </>
        )}
      </div>
    </div>
  )
}
