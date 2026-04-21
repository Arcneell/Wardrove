import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HUD } from '@/components/layout/HUD'
import { ToastContainer } from '@/components/rpg/AchievementToast'
import { LoginModal } from '@/components/ui/LoginModal'
import { UploadModal } from '@/components/ui/UploadModal'
import { useAuthStore } from '@/stores/authStore'
import { refreshToken, apiFetch } from '@/api/client'
import type { User } from '@/api/types'

const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })))
const LeaderboardPage = lazy(() =>
  import('@/pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
)
const ArmoryPage = lazy(() =>
  import('@/pages/ArmoryPage').then((m) => ({ default: m.ArmoryPage })),
)
const StatsPage = lazy(() =>
  import('@/pages/StatsPage').then((m) => ({ default: m.StatsPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const MyQuarters = lazy(() =>
  import('@/pages/MyQuarters').then((m) => ({ default: m.MyQuarters })),
)
const TermsPage = lazy(() =>
  import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })),
)

function PageLoader() {
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
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          color: 'var(--color-sepia)',
        }}
      >
        Unfurling the scroll…
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  // The main element is re-keyed on pathname so page-turn-in replays.
  return (
    <main
      key={location.pathname}
      className="anim-page parchment-bg"
      style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<MapPage />} />
          <Route path="/armory" element={<ArmoryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/quarters" element={<MyQuarters />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </Suspense>
    </main>
  )
}

function AuthInitializer() {
  const { setToken, setUser } = useAuthStore()

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const authCode = params.get('auth_code')

      if (authCode) {
        window.history.replaceState({}, '', '/')
        try {
          const res = await fetch('/api/v1/auth/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_code: authCode }),
          })
          if (res.ok) {
            const data = await res.json()
            setToken(data.access_token, data.expires_in)
          }
        } catch {
          /* noop — user can retry sign-in */
        }
      } else {
        await refreshToken()
      }

      const token = useAuthStore.getState().accessToken
      if (token) {
        try {
          const user = await apiFetch<User>('/auth/me')
          setUser(user)
        } catch {
          /* noop — unauthenticated flow */
        }
      }
    }

    init()
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      {/* Table surface; the grimoire sits on top and slides in on navigation. */}
      <div
        style={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(8px, 1.6vw, 24px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="grimoire-sheet"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 0,
            maxWidth: '100%',
            border: '3px double var(--color-ink)',
            overflow: 'hidden',
          }}
        >
          <HUD />
          <AppRoutes />
        </div>
      </div>
      <LoginModal />
      <UploadModal />
      <ToastContainer />
    </BrowserRouter>
  )
}
