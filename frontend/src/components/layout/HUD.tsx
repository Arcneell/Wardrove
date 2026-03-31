import { Link, useLocation } from 'react-router-dom'
import {
  Map, Radio, Trophy, BarChart3, Upload,
  Menu, LogIn, LogOut, Swords, Shield,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatXP } from '@/lib/xp'

const NAV_ITEMS = [
  { path: '/',            icon: Map,       label: 'Map' },
  { path: '/armory',      icon: Swords,    label: 'Armory' },
  { path: '/leaderboard', icon: Trophy,    label: 'Arena' },
  { path: '/stats',       icon: BarChart3, label: 'World' },
]

const AUTH_NAV = [
  { path: '/quarters',    icon: Shield,    label: 'Quarters' },
]

export function HUD() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const { setLoginModalOpen, setUploadModalOpen, toggleSidebar } = useUIStore()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="parchment-header flex-shrink-0 z-50">
      <div className="flex items-center h-14 px-4 sm:px-6 gap-3">

        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border text-secondary hover:text-gold hover:border-gold/40 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 mr-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shadow-md">
            <Radio size={16} className="text-void" />
          </div>
          <span className="font-display font-bold text-[17px] tracking-wide hidden sm:block">
            <span className="text-gold">WAR</span>
            <span className="text-secondary">DROVE</span>
          </span>
        </Link>

        {/* Separator */}
        <div className="hidden md:block w-px h-6 bg-border" />

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                isActive(path)
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-secondary hover:text-primary hover:bg-surface border border-transparent'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {isAuthenticated && AUTH_NAV.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                isActive(path)
                  ? 'bg-epic/10 text-epic border border-epic/20'
                  : 'text-secondary hover:text-primary hover:bg-surface border border-transparent'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold bg-xp/10 text-xp border border-xp/20 hover:bg-xp/15 transition-all"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">Upload</span>
              </button>

              <div className="hidden md:block w-px h-6 bg-border" />

              <Link to="/quarters" className="flex items-center gap-2.5 group flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full border-2 border-gold/30 group-hover:border-gold/60 transition-colors" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface border-2 border-gold/30 flex items-center justify-center text-sm font-bold text-gold">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col">
                  <span className="text-[13px] font-semibold text-primary group-hover:text-gold transition-colors leading-tight">
                    {user?.username}
                  </span>
                  <span className="text-[11px] font-mono text-secondary leading-tight">
                    Lvl {user?.level} · {formatXP(user?.xp ?? 0)} XP
                  </span>
                </div>
              </Link>

              <button
                onClick={async () => {
                  await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
                  useAuthStore.getState().clearAuth()
                }}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/15 transition-all"
            >
              <LogIn size={16} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
