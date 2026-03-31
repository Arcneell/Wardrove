import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from './Modal'
import { useUIStore } from '@/stores/uiStore'
import { Github } from 'lucide-react'

export function LoginModal() {
  const { loginModalOpen, setLoginModalOpen } = useUIStore()
  const [tosAccepted, setTosAccepted] = useState(false)

  const loginGithub = async () => {
    if (!tosAccepted) return
    try {
      const res = await fetch('/api/v1/auth/login/github')
      const data = await res.json()
      window.location.href = data.redirect_url
    } catch (e) {
      console.error('GitHub login failed:', e)
    }
  }

  return (
    <Modal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Join the Guild">
      <div className="text-center mb-5">
        <div className="font-display text-xl font-bold text-primary mb-2">Welcome, Wanderer</div>
        <p className="text-xs text-secondary leading-relaxed">
          Sign in to begin your quest. Upload captures, earn XP, unlock badges, and rise through the ranks.
        </p>
      </div>

      <label className="flex items-start gap-2.5 mb-5 cursor-pointer group">
        <input
          type="checkbox"
          checked={tosAccepted}
          onChange={(e) => setTosAccepted(e.target.checked)}
          className="mt-0.5 accent-gold"
        />
        <span className="text-[11px] text-secondary group-hover:text-primary transition-colors leading-relaxed">
          I accept the{' '}
          <Link
            to="/terms"
            onClick={() => setLoginModalOpen(false)}
            className="text-gold hover:underline"
          >
            Terms of Service
          </Link>
          . I understand that uploaded data will be publicly visible and aggregated.
        </span>
      </label>

      <button
        onClick={loginGithub}
        disabled={!tosAccepted}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg bg-[#24292e] hover:bg-[#2f363d] text-white text-sm font-semibold transition-colors border border-[#3d4148] disabled:opacity-25 disabled:cursor-not-allowed"
      >
        <Github size={18} />
        Continue with GitHub
      </button>

      <p className="text-[9px] text-muted text-center mt-4">
        Your GitHub profile will be used to forge your player identity.
      </p>
    </Modal>
  )
}
