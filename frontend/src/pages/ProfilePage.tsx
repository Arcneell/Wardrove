import { useParams } from 'react-router-dom'
import { useUserProfile, useUserBadges } from '@/api/hooks'
import { BadgeCard } from '@/components/rpg/BadgeCard'
import { formatNumber, formatDate } from '@/lib/format'
import { getCategoryLabel } from '@/lib/badges'
import {
  PageHeader,
  ParchmentCard,
  PanelTitle,
  SheetStat,
} from '@/components/parchment/Primitives'
import { LevelRingParchment, XpShimmerBar } from '@/components/parchment/RpgBits'
import { PlumeWifi, PlumeBluetooth, PlumeRadio, PlumeUpload } from '@/components/icons/PlumeIcons'

export function ProfilePage() {
  const { userId } = useParams()
  const { data: profile, loading } = useUserProfile(userId)
  const { data: badges } = useUserBadges(profile?.user_id)

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <ParchmentCard padding={32} style={{ textAlign: 'center' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--color-sepia)' }}>
            The herald is fetching the folio…
          </span>
        </ParchmentCard>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <ParchmentCard padding={32} style={{ textAlign: 'center' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--color-sepia)' }}>
            No herald by that name here.
          </span>
        </ParchmentCard>
      </div>
    )
  }

  const earnedBadges = badges?.filter((b) => b.earned) ?? []
  const badgesByCategory = groupBy(badges ?? [], 'category')

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', width: '100%' }}>
        <PageHeader
          title="Herald's Record"
          subtitle={`${profile.rank} — a folio of "${profile.username}"`}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 28 }}>
          <ParchmentCard padding={24}>
            <div style={{ textAlign: 'center' }}>
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
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
              <h2
                className="font-display"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                  letterSpacing: '0.08em',
                  marginTop: 14,
                }}
              >
                {profile.username}
              </h2>
              {profile.global_rank > 0 && (
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold-tarnish)',
                    marginTop: 4,
                  }}
                >
                  World Rank #{profile.global_rank}
                </div>
              )}
              {profile.created_at && (
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 11,
                    color: 'var(--color-sepia)',
                    marginTop: 6,
                  }}
                >
                  Joined {formatDate(profile.created_at)}
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <XpShimmerBar progress={profile.xp_progress ?? 0} />
                <div
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--color-sepia)',
                    marginTop: 6,
                  }}
                >
                  {formatNumber(profile.xp)} XP
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
              }}
            >
              <SheetStat label="WiFi" value={formatNumber(profile.wifi_discovered)} />
              <SheetStat label="Bluetooth" value={formatNumber(profile.bt_discovered)} />
              <SheetStat label="Towers" value={formatNumber(profile.cell_discovered)} />
              <SheetStat label="Scrolls" value={formatNumber(profile.total_uploads)} />
            </div>
          </ParchmentCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ParchmentCard padding={24}>
              <PanelTitle>Deeds Ledger</PanelTitle>
              <ul
                style={{
                  listStyle: 'none',
                  margin: '14px 0 0',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <DeedRow icon={<PlumeWifi size={22} color="var(--color-layer-wifi)" />} label="Wi-Fi networks charted" value={profile.wifi_discovered} color="var(--color-layer-wifi)" />
                <DeedRow icon={<PlumeBluetooth size={22} color="var(--color-layer-bt)" />} label="Bluetooth signatures" value={profile.bt_discovered} color="var(--color-layer-bt)" />
                <DeedRow icon={<PlumeRadio size={22} color="var(--color-layer-cell)" />} label="Cell towers logged" value={profile.cell_discovered} color="var(--color-layer-cell)" />
                <DeedRow icon={<PlumeUpload size={22} color="var(--color-sepia)" />} label="Scrolls filed" value={profile.total_uploads} color="var(--color-ink)" />
              </ul>
            </ParchmentCard>

            {earnedBadges.length > 0 && (
              <ParchmentCard padding={24}>
                <PanelTitle>Hall of Trophies</PanelTitle>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    color: 'var(--color-sepia)',
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  {earnedBadges.length} sealed
                </div>
                {Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
                  const earned = categoryBadges.filter((b) => b.earned)
                  if (earned.length === 0) return null
                  return (
                    <div key={category} style={{ marginTop: 20 }}>
                      <div
                        style={{
                          textAlign: 'center',
                          marginBottom: 12,
                          paddingBottom: 6,
                          borderBottom: '1px dotted rgba(26,20,16,0.25)',
                        }}
                      >
                        <span
                          className="font-display"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: 'var(--color-gold-tarnish)',
                          }}
                        >
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: 14,
                        }}
                      >
                        {earned.map((badge) => (
                          <BadgeCard key={badge.id} badge={badge} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </ParchmentCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeedRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px dotted rgba(26,20,16,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink)' }}>
          {label}
        </span>
      </div>
      <span
        className="font-mono"
        style={{ fontSize: 17, fontWeight: 700, color }}
      >
        {formatNumber(value)}
      </span>
    </li>
  )
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key])
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}
