import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from './Modal'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { WaxSeal, FlourishDivider } from '@/components/parchment/Primitives'
import type { User } from '@/api/types'

interface Providers {
  github: boolean
  demo: boolean
}

export function LoginModal() {
  const { loginModalOpen, setLoginModalOpen, addToast } = useUIStore()
  const [tosAccepted, setTosAccepted] = useState(false)
  const [providers, setProviders] = useState<Providers>({ github: false, demo: false })
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!loginModalOpen) return
    fetch('/api/v1/auth/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Providers | null) => {
        if (data) setProviders(data)
      })
      .catch(() => {
        /* network hiccup — default providers stay false */
      })
  }, [loginModalOpen])

  const loginGithub = async () => {
    if (!tosAccepted) return
    setLoading('github')
    try {
      const res = await fetch('/api/v1/auth/login/github')
      if (!res.ok) {
        const msg = await res.text()
        addToast({ type: 'error', title: 'GitHub sign-in unavailable', message: msg.slice(0, 160) })
        return
      }
      const data = await res.json()
      window.location.href = data.redirect_url
    } catch (e) {
      addToast({ type: 'error', title: 'Sign-in failed', message: (e as Error).message })
    } finally {
      setLoading(null)
    }
  }

  const loginDemo = async () => {
    if (!tosAccepted) return
    setLoading('demo')
    try {
      const res = await fetch('/api/v1/auth/demo', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        addToast({
          type: 'error',
          title: 'Demo sign-in failed',
          message: body.detail ?? 'Check the backend logs',
        })
        return
      }
      const data = (await res.json()) as { access_token: string; expires_in: number }
      useAuthStore.getState().setToken(data.access_token, data.expires_in)

      // Pull /auth/me so the HUD has a live profile immediately.
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      if (meRes.ok) {
        const user = (await meRes.json()) as User
        useAuthStore.getState().setUser(user)
      }
      setLoginModalOpen(false)
      addToast({ type: 'success', title: 'Welcome back, demo ⚜' })
    } catch (e) {
      addToast({ type: 'error', title: 'Demo sign-in failed', message: (e as Error).message })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} title="Join the Guild">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <WaxSeal label="W" size={68} rotate={-6} />
        <div style={{ width: '100%' }}>
          <div
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--color-ink)',
              letterSpacing: '0.14em',
              textAlign: 'center',
            }}
          >
            WELCOME, WANDERER
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              color: 'var(--color-sepia)',
              fontSize: 15,
              lineHeight: 1.55,
              maxWidth: 420,
              margin: '10px auto 0',
              textAlign: 'center',
            }}
          >
            Sign the ledger to begin your quest — upload captures, earn XP,
            unlock badges, rise through the ranks.
          </p>
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          cursor: 'pointer',
          marginBottom: 24,
          padding: 14,
          border: '1px solid rgba(26,20,16,0.25)',
          background: 'rgba(232,220,192,0.55)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--color-ink)',
        }}
      >
        <input
          type="checkbox"
          checked={tosAccepted}
          onChange={(e) => setTosAccepted(e.target.checked)}
          style={{
            marginTop: 3,
            width: 18,
            height: 18,
            flexShrink: 0,
            accentColor: 'var(--color-wax-red)',
            border: '2px solid var(--color-ink)',
          }}
        />
        <span>
          I accept the{' '}
          <Link
            to="/terms"
            onClick={() => setLoginModalOpen(false)}
            style={{
              color: 'var(--color-wax-red)',
              textDecoration: 'underline dashed',
            }}
          >
            Terms of Service
          </Link>
          . Uploaded data becomes publicly visible and aggregated.
        </span>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'stretch' }}>
        {providers.github ? (
          <button
            type="button"
            onClick={loginGithub}
            disabled={!tosAccepted || loading !== null}
            className="btn-wax"
            style={{ padding: '14px 18px', fontSize: 14 }}
          >
            {loading === 'github' ? 'Opening GitHub…' : 'Continue with GitHub'}
          </button>
        ) : (
          <div
            style={{
              padding: 14,
              border: '1px dashed var(--color-ink)',
              background: 'rgba(139, 26, 26, 0.05)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--color-sepia)',
              textAlign: 'center',
            }}
          >
            GitHub OAuth is not configured on this server. Set{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>GITHUB_CLIENT_ID</code>{' '}
            and{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>GITHUB_CLIENT_SECRET</code>{' '}
            in <code style={{ fontFamily: 'var(--font-mono)' }}>.env</code>.
          </div>
        )}

        {providers.demo && (
          <>
            <div style={{ margin: '6px 0' }}>
              <FlourishDivider />
            </div>
            <button
              type="button"
              onClick={loginDemo}
              disabled={!tosAccepted || loading !== null}
              className="btn-parchment"
              style={{ padding: '12px 18px', fontSize: 14 }}
            >
              {loading === 'demo' ? 'Unsealing the demo…' : 'Enter as Demo'}
            </button>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--color-sepia)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              Pre-seeded account — ~420 WiFi, 140 BT, 60 towers, badges already inscribed.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
