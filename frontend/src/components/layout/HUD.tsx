import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useMyProfile } from '@/api/hooks'
import { formatXP, rankTitle, xpProgress, levelFromXp } from '@/lib/xp'
import { XpShimmerBar } from '@/components/parchment/RpgBits'
import { WaxSeal } from '@/components/parchment/Primitives'
import {
  PlumeMap,
  PlumeSword,
  PlumeCrown,
  PlumeGlobe,
  PlumeShield,
  PlumeUpload,
  PlumeLock,
} from '@/components/icons/PlumeIcons'
import type { ComponentType } from 'react'

interface NavItem {
  to: string
  label: string
  Icon: ComponentType<{ size?: number; color?: string }>
  authOnly?: boolean
  matchExact?: boolean
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/',            label: 'Map',     Icon: PlumeMap,   matchExact: true },
  { to: '/armory',      label: 'Armory',  Icon: PlumeSword },
  { to: '/leaderboard', label: 'Arena',   Icon: PlumeCrown },
  { to: '/stats',       label: 'World',   Icon: PlumeGlobe },
  { to: '/quarters',    label: 'Quarters', Icon: PlumeShield, authOnly: true },
]

export function HUD() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const { setLoginModalOpen, setUploadModalOpen, setSidebarOpen, addToast } = useUIStore()
  const { data: profile } = useMyProfile(isAuthenticated)

  const liveLevel = profile?.level ?? user?.level ?? (user?.xp ? levelFromXp(user.xp) : 1)
  const liveXp = profile?.xp ?? user?.xp ?? 0
  const progress = profile
    ? profile.xp_progress ?? xpProgress(liveXp, liveLevel).progress
    : xpProgress(liveXp, liveLevel).progress
  const liveRank = profile?.rank ?? rankTitle(liveLevel).name

  const isActive = (item: NavItem) =>
    item.matchExact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  const profileItem: NavItem | null = user
    ? { to: `/profile/${user.id}`, label: 'Profile', Icon: PlumeLock, authOnly: true }
    : null

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      addToast({ type: 'error', title: 'Could not reach the server to log out' })
    } finally {
      useAuthStore.getState().clearAuth()
    }
  }

  return (
    <header
      className="grimoire-ribbon sticky top-0 flex-shrink-0"
      style={{
        zIndex: 50,
        borderBottom: '3px double var(--color-ink)',
        boxShadow:
          '0 4px 0 rgba(26,20,16,0.4), 0 6px 18px rgba(0,0,0,0.25)',
      }}
    >
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: 1400,
          padding: 'var(--hud-pad-y) var(--hud-pad-x)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          className="hud-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--color-ink)',
            textDecoration: 'none',
            minWidth: 0,
          }}
        >
          <WaxSeal label="W" size={42} rotate={-6} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              className="font-display hud-brand-wordmark"
              style={{
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: '0.26em',
                color: 'var(--color-ink)',
              }}
            >
              WARDROVE
            </span>
            <span
              className="hud-subtitle"
              style={{
                fontSize: 12,
                fontStyle: 'italic',
                color: 'var(--color-sepia)',
                letterSpacing: '0.06em',
                marginTop: 2,
              }}
            >
              an illuminated atlas of the unseen
            </span>
          </div>
        </Link>

        {/* Centre nav */}
        <nav
          aria-label="Main navigation"
          className="hud-nav"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            flexWrap: 'wrap',
          }}
        >
          {[...PRIMARY_NAV, ...(profileItem ? [profileItem] : [])].map((item) => {
            if (item.authOnly && !isAuthenticated) return null
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`tab-ribbon ${active ? 'active' : ''}`}
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <item.Icon size={14} color={active ? 'var(--color-wax-red)' : 'var(--color-sepia)'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="btn-wax"
                style={{ gap: 8 }}
              >
                <PlumeUpload size={14} color="var(--color-parchment-light)" />
                <span>Inscribe</span>
              </button>

              <Link
                to="/quarters"
                className="hud-right-extras"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 8px',
                  border: '1px solid rgba(26,20,16,0.35)',
                  background: 'rgba(240, 228, 200, 0.6)',
                  textDecoration: 'none',
                  color: 'var(--color-ink)',
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    style={{
                      width: 34,
                      height: 34,
                      border: '2px solid var(--color-ink)',
                      boxShadow: 'var(--shadow-stamp)',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      border: '2px solid var(--color-ink)',
                      background: 'var(--color-parchment-light)',
                      boxShadow: 'var(--shadow-stamp)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      color: 'var(--color-wax-red)',
                    }}
                  >
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="hud-profile-details" style={{ display: 'flex', flexDirection: 'column', minWidth: 140, gap: 3 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 10,
                      fontSize: 13,
                      color: 'var(--color-ink)',
                    }}
                  >
                    <span className="font-display" style={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                      {user?.username}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--color-gold-tarnish)', fontWeight: 700 }}>
                      Lv {liveLevel}
                    </span>
                  </div>
                  <XpShimmerBar progress={progress} />
                  <div
                    style={{
                      fontSize: 11,
                      fontStyle: 'italic',
                      color: 'var(--color-sepia)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {liveRank} · {formatXP(liveXp)} XP
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Log out"
                aria-label="Log out"
                style={{
                  width: 34,
                  height: 34,
                  border: '2px solid var(--color-ink)',
                  background: 'var(--color-parchment-light)',
                  boxShadow: 'var(--shadow-stamp)',
                  color: 'var(--color-sepia)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="btn-parchment"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
