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
    <header className="ornate-header flex-shrink-0 z-50 relative">
      <div className="flex items-center h-12 px-3 sm:px-5 gap-2 sm:gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-border text-secondary hover:text-gold hover:border-gold/40 transition-colors"
        >
          <Menu size={16} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-gold/80 to-gold-dim flex items-center justify-center shadow-sm">
            <Radio size={13} className="text-void" />
          </div>
          <span className="font-display font-bold text-base tracking-wide hidden sm:block">
            <span className="text-gold">WAR</span>
            <span className="text-secondary">DROVE</span>
          </span>
        </Link>

        {/* Ornamental separator */}
        <div className="hidden sm:block w-px h-5 bg-border mx-1" />

        {/* Nav tabs — centered */}
        <nav className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center sm:justify-start overflow-x-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
                isActive(path)
                  ? 'bg-gold/12 text-gold border border-gold/25 shadow-sm shadow-gold/5'
                  : 'text-secondary hover:text-primary hover:bg-surface border border-transparent'
              }`}
            >
              <Icon size={14} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}

          {isAuthenticated && AUTH_NAV.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
                isActive(path)
                  ? 'bg-epic/12 text-epic border border-epic/25 shadow-sm shadow-epic/5'
                  : 'text-secondary hover:text-primary hover:bg-surface border border-transparent'
              }`}
            >
              <Icon size={14} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-xp/10 text-xp border border-xp/25 hover:bg-xp/20 hover:border-xp/40 transition-all"
              >
                <Upload size={13} />
                <span className="hidden sm:inline">Upload</span>
              </button>

              <div className="hidden sm:block w-px h-5 bg-border" />

              <Link to="/quarters" className="flex items-center gap-2 group flex-shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full border-2 border-gold/30 group-hover:border-gold/60 transition-colors"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface border-2 border-gold/30 flex items-center justify-center text-[10px] font-bold text-gold">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:flex flex-col items-end">
                  <span className="font-mono text-[11px] font-semibold text-primary group-hover:text-gold transition-colors leading-none">
                    {user?.username}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono font-bold text-legendary leading-none">
                      Lvl {user?.level}
                    </span>
                    <span className="text-[9px] font-mono text-xp leading-none">
                      {formatXP(user?.xp ?? 0)} XP
                    </span>
                  </div>
                </div>
              </Link>

              <button
                onClick={async () => {
                  await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
                  useAuthStore.getState().clearAuth()
                }}
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-all"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gold/10 text-gold border border-gold/25 hover:bg-gold/20 hover:border-gold/40 transition-all"
            >
              <LogIn size={14} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
