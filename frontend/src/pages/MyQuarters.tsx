import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useMyProfile, useUserBadges, useUploadHistory } from '@/api/hooks'
import { BadgeCard } from '@/components/rpg/BadgeCard'
import { formatNumber, formatDate, timeAgo } from '@/lib/format'
import { getCategoryLabel } from '@/lib/badges'
import { authFetch, apiFetch } from '@/api/client'
import type { ApiToken } from '@/api/types'
import {
  PageHeader,
  ParchmentCard,
  PanelTitle,
  RibbonTabs,
  InkPill,
  SheetStat,
} from '@/components/parchment/Primitives'
import { LevelRingParchment, XpShimmerBar } from '@/components/parchment/RpgBits'
import { PlumeShield, PlumeWifi, PlumeBluetooth, PlumeRadio, PlumeUpload } from '@/components/icons/PlumeIcons'

type Tab = 'overview' | 'badges' | 'uploads' | 'settings'

export function MyQuarters() {
  const [tab, setTab] = useState<Tab>('overview')
  const { user } = useAuthStore()
  const { data: profile } = useMyProfile(!!user)
  const { data: badges } = useUserBadges(user?.id)
  const { data: uploads } = useUploadHistory(50, 0, !!user)

  if (!user || !profile) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
        }}
      >
        <ParchmentCard padding={32} style={{ maxWidth: 400, textAlign: 'center' }}>
          <PlumeShield size={44} color="var(--color-wax-red)" />
          <h1
            className="font-display"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-ink)',
              marginTop: 12,
              letterSpacing: '0.08em',
            }}
          >
            Quarters Locked
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              color: 'var(--color-sepia)',
              marginTop: 10,
              fontSize: 13,
            }}
          >
            Sign the ledger to open your personal hall.
          </p>
        </ParchmentCard>
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

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--page-pad-y) var(--page-pad-x)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <PageHeader
          title="My Quarters"
          subtitle={`${profile.rank} — "${user.username}"`}
        />

        <div style={{ maxWidth: 700, margin: '0 auto 20px' }}>
          <RibbonTabs<Tab>
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'badges', label: `Grimoire (${earnedCount}/${totalCount})` },
              { id: 'uploads', label: 'Scrolls' },
              { id: 'settings', label: 'Seals & Keys' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'overview' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: 24,
            }}
          >
            <ParchmentCard padding={24}>
              <div style={{ textAlign: 'center' }}>
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt=""
                    style={{
                      width: 84,
                      height: 84,
                      border: '3px double var(--color-ink)',
                      boxShadow: 'var(--shadow-stamp)',
                      objectFit: 'cover',
                      margin: '0 auto 12px',
                    }}
                  />
                )}
                <LevelRingParchment
                  level={profile.level}
                  xpProgress={profile.xp_progress ?? 0}
                  size={150}
                  rank={profile.rank}
                />
                <div style={{ marginTop: 16 }}>
                  <XpShimmerBar progress={profile.xp_progress ?? 0} />
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--color-sepia)',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {formatNumber(profile.xp_current_level ?? 0)} / {formatNumber(profile.xp_next_level ?? 0)} XP
                  </div>
                </div>
                {profile.global_rank > 0 && (
                  <div
                    style={{
                      marginTop: 14,
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--color-gold-tarnish)',
                    }}
                  >
                    World Rank #{profile.global_rank}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 20,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                }}
              >
                <SheetStat label="Trophies" value={earnedCount} />
                <SheetStat label="World Pos" value={profile.global_rank > 0 ? `#${profile.global_rank}` : '—'} />
              </div>
            </ParchmentCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ParchmentCard padding={20}>
                <PanelTitle>Chronicles</PanelTitle>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <StatCell icon={<PlumeWifi size={24} color="var(--color-layer-wifi)" />} label="WiFi" value={profile.wifi_discovered} />
                  <StatCell icon={<PlumeBluetooth size={24} color="var(--color-layer-bt)" />} label="Bluetooth" value={profile.bt_discovered} />
                  <StatCell icon={<PlumeRadio size={24} color="var(--color-layer-cell)" />} label="Towers" value={profile.cell_discovered} />
                  <StatCell icon={<PlumeUpload size={24} color="var(--color-sepia)" />} label="Scrolls" value={profile.total_uploads} />
                </div>
              </ParchmentCard>

              {earnedCount > 0 && badges && (
                <ParchmentCard padding={20}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 14,
                    }}
                  >
                    <PanelTitle align="left">Recently Inscribed</PanelTitle>
                    <button
                      type="button"
                      onClick={() => setTab('badges')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-gold-tarnish)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      View all ›
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 14,
                      marginTop: 10,
                    }}
                  >
                    {badges
                      .filter((b) => b.earned)
                      .slice(-4)
                      .reverse()
                      .map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} />
                      ))}
                  </div>
                </ParchmentCard>
              )}
            </div>
          </div>
        )}

        {tab === 'badges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <ParchmentCard padding={24} style={{ textAlign: 'center' }}>
              <div
                className="font-display"
                style={{
                  fontSize: 44,
                  fontWeight: 700,
                  color: 'var(--color-gold-tarnish)',
                  letterSpacing: '0.04em',
                }}
              >
                {earnedCount} / {totalCount}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--color-sepia)',
                  marginBottom: 12,
                }}
              >
                seals inscribed
              </div>
              <div style={{ maxWidth: 360, margin: '0 auto' }}>
                <XpShimmerBar progress={totalCount > 0 ? earnedCount / totalCount : 0} />
              </div>
            </ParchmentCard>

            {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
              <section key={category}>
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: 14,
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(26,20,16,0.25)',
                  }}
                >
                  <h3
                    className="font-display"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'var(--color-gold-tarnish)',
                      margin: 0,
                    }}
                  >
                    {getCategoryLabel(category)}
                  </h3>
                  <div
                    style={{
                      fontSize: 10,
                      fontStyle: 'italic',
                      color: 'var(--color-sepia)',
                      marginTop: 2,
                    }}
                  >
                    {categoryBadges.filter((b) => b.earned).length} / {categoryBadges.length} earned
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: 18,
                  }}
                >
                  {categoryBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      showProgress
                      currentValue={userValues[badge.criteria_type] ?? 0}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === 'uploads' && (
          <div>
            {!uploads || uploads.length === 0 ? (
              <ParchmentCard padding={32} style={{ textAlign: 'center' }}>
                <PlumeUpload size={40} color="var(--color-sepia-muted)" />
                <h2
                  className="font-display"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    marginTop: 10,
                    letterSpacing: '0.1em',
                  }}
                >
                  No Scrolls Yet
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'var(--color-sepia)',
                    marginTop: 8,
                  }}
                >
                  Upload your first capture to ink the opening line of the quest log.
                </p>
              </ParchmentCard>
            ) : (
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
                      {['Scroll', 'Format', 'When', 'WiFi', 'BT', 'Cell', 'XP', 'Status'].map((c) => (
                        <th
                          key={c}
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
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((tx, i) => (
                      <tr
                        key={tx.id}
                        style={{
                          background: i % 2 === 1 ? 'rgba(139,69,19,0.05)' : 'transparent',
                          borderBottom: '1px dotted rgba(26,20,16,0.25)',
                        }}
                      >
                        <td style={{ padding: '10px 14px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--color-ink)', fontWeight: 700 }}>
                            {tx.filename}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {tx.file_format ? <InkPill>{tx.file_format}</InkPill> : <span style={{ color: 'var(--color-sepia-muted)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontStyle: 'italic', color: 'var(--color-sepia)' }}>
                          {timeAgo(tx.uploaded_at)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-layer-wifi)' }}>
                            {formatNumber(tx.wifi_count)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-layer-bt)' }}>
                            {formatNumber(tx.bt_count + (tx.ble_count ?? 0))}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-layer-cell)' }}>
                            {formatNumber(tx.cell_count)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--color-gold-tarnish)', fontWeight: 700 }}>
                            +{formatNumber(tx.xp_earned)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <StatusBadge status={tx.status} message={tx.status_message} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ParchmentCard>
            )}
          </div>
        )}

        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div
      style={{
        border: '1px solid rgba(26,20,16,0.35)',
        background: 'rgba(232,220,192,0.5)',
        padding: 12,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        {icon}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)' }}
      >
        {formatNumber(value)}
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 9,
          letterSpacing: '0.15em',
          color: 'var(--color-sepia)',
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function StatusBadge({ status, message }: { status: string; message: string | null }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    done: { bg: 'rgba(61,90,42,0.15)', color: '#3d5a2a', label: 'Done' },
    error: { bg: 'rgba(139,26,26,0.12)', color: '#8b1a1a', label: 'Error' },
    pending: { bg: 'rgba(107,72,32,0.12)', color: '#6b4820', label: 'Queued' },
    parsing: { bg: 'rgba(42,74,107,0.12)', color: '#2a4a6b', label: 'Parsing' },
    trilaterating: { bg: 'rgba(42,74,107,0.12)', color: '#2a4a6b', label: 'Locating' },
    indexing: { bg: 'rgba(42,74,107,0.12)', color: '#2a4a6b', label: 'Indexing' },
  }
  const cfg = map[status] ?? map.pending
  return (
    <span
      title={message ?? undefined}
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        border: `1px solid ${cfg.color}`,
        color: cfg.color,
        background: cfg.bg,
        fontSize: 10,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {cfg.label}
    </span>
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
    } catch {
      /* noop — errors surfaced when user tries to operate */
    }
  }

  useEffect(() => {
    loadTokens()
  }, [])

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
    } catch {
      /* toast shown by caller eventually */
    } finally {
      setLoading(false)
    }
  }

  const revokeToken = async (id: number) => {
    try {
      await authFetch(`/auth/tokens/${id}`, { method: 'DELETE' })
      loadTokens()
    } catch {
      /* noop */
    }
  }

  return (
    <ParchmentCard padding={24}>
      <PanelTitle>Seals & Keys</PanelTitle>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          color: 'var(--color-sepia)',
          fontSize: 13,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        Keys cut for scripts and rigs. Copy once — the vault forgets the plain text.
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <input
          id="new-token-name"
          value={newTokenName}
          onChange={(e) => setNewTokenName(e.target.value)}
          placeholder="Name for this key…"
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '2px solid var(--color-ink)',
            background: 'var(--color-parchment-light)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-ink)',
            boxShadow: 'var(--shadow-stamp)',
          }}
        />
        <button
          type="button"
          className="btn-wax"
          onClick={createToken}
          disabled={!newTokenName.trim() || loading}
        >
          Mint Key
        </button>
      </div>

      {newToken && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            border: '2px dashed var(--color-ink)',
            background: 'var(--color-parchment)',
          }}
        >
          <div
            className="font-display"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-wax-red)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Copy now — it will not be shown again
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: 10,
                background: 'var(--color-parchment-dark)',
                border: '1px solid var(--color-ink)',
                wordBreak: 'break-all',
              }}
            >
              {newToken}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(newToken)}
              className="btn-parchment"
              style={{ padding: '6px 10px' }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <ul
        style={{
          listStyle: 'none',
          margin: '18px 0 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {tokens.length === 0 ? (
          <li
            style={{
              textAlign: 'center',
              padding: 20,
              color: 'var(--color-sepia)',
              fontStyle: 'italic',
            }}
          >
            No keys forged yet.
          </li>
        ) : (
          tokens.map((t) => (
            <li
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid rgba(26,20,16,0.35)',
                background: 'var(--color-parchment)',
              }}
            >
              <div>
                <div
                  className="font-display"
                  style={{
                    fontWeight: 700,
                    color: t.revoked ? 'var(--color-sepia-muted)' : 'var(--color-ink)',
                    textDecoration: t.revoked ? 'line-through' : undefined,
                  }}
                >
                  {t.name}
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 10, color: 'var(--color-sepia)', marginTop: 2 }}
                >
                  Forged {formatDate(t.created_at)}
                </div>
              </div>
              {t.revoked ? (
                <span style={{ fontSize: 11, color: 'var(--color-sepia-muted)', fontStyle: 'italic' }}>
                  Revoked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => revokeToken(t.id)}
                  className="btn-parchment"
                  style={{ padding: '4px 10px' }}
                >
                  Revoke
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </ParchmentCard>
  )
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}
