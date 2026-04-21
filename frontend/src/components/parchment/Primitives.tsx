import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

/**
 * Parchment design-system primitives.
 * Mirrors the handoff "design_handoff_wardrove_parchment" components —
 * all visual tokens live in globals.css (@theme).
 */

// ────────────────────────────────────────────────────────────────
// ParchmentCard — base card surface
// ────────────────────────────────────────────────────────────────
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raw?: boolean
  padding?: number | string
}

export function ParchmentCard({
  raw,
  padding,
  className = '',
  style,
  children,
  ...rest
}: CardProps) {
  const cls = raw ? 'parchment-card-raw' : 'parchment-card'
  const mergedStyle: CSSProperties = { padding, ...style }
  return (
    <div className={`${cls} ${className}`} style={mergedStyle} {...rest}>
      {children}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// PanelTitle — "section" heading inside a card
// ────────────────────────────────────────────────────────────────
export function PanelTitle({
  children,
  align = 'center',
  className = '',
}: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}) {
  return (
    <h3
      className={`font-display ${className}`}
      style={{
        margin: 0,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.15em',
        color: 'var(--color-wax-red)',
        textTransform: 'uppercase',
        textAlign: align,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(26, 20, 16, 0.35)',
      }}
    >
      {children}
    </h3>
  )
}

// ────────────────────────────────────────────────────────────────
// PageHeader — big title + italic subtitle + flourish
// ────────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
      <h1
        className="font-display"
        style={{
          margin: 0,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'var(--color-ink)',
          lineHeight: 1.1,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <div
          style={{
            color: 'var(--color-sepia)',
            fontStyle: 'italic',
            fontSize: 16,
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          {subtitle}
        </div>
      )}
      <div style={{ maxWidth: 400, margin: '14px auto 0' }}>
        <FlourishDivider />
      </div>
      {children}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// FlourishDivider — line / glyph / line
// ────────────────────────────────────────────────────────────────
export function FlourishDivider({ glyph = '❦' }: { glyph?: string }) {
  return <div className="flourish-divider">{glyph}</div>
}

// ────────────────────────────────────────────────────────────────
// InkPill — small outlined tag for table cells
// ────────────────────────────────────────────────────────────────
export function InkPill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        border: '1px solid var(--color-ink)',
        background: 'var(--color-parchment)',
        fontSize: 11,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: 'var(--color-ink)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────
// InkStamp — rotated wax-red label used on podium entries
// ────────────────────────────────────────────────────────────────
export function InkStamp({
  children,
  rotate = -3,
}: {
  children: ReactNode
  rotate?: number
}) {
  return (
    <span className="ink-stamp" style={{ transform: `rotate(${rotate}deg)` }}>
      {children}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────
// WaxSeal — circular red seal, used for rank numbers, HUD logo
// ────────────────────────────────────────────────────────────────
export function WaxSeal({
  label = 'W',
  size = 48,
  rotate = -4,
  style,
}: {
  label?: ReactNode
  size?: number
  rotate?: number
  style?: CSSProperties
}) {
  return (
    <span
      className="wax-seal"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {label}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────
// SheetStat — D&D-style boxed stat (Overview / Character Sheet)
// ────────────────────────────────────────────────────────────────
export function SheetStat({
  label,
  value,
  flame,
  small,
}: {
  label: string
  value: ReactNode
  flame?: boolean
  small?: boolean
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 10,
        border: '1px solid rgba(26,20,16,0.35)',
        background: 'rgba(232,220,192,0.5)',
      }}
    >
      <div
        className="font-mono"
        style={{
          fontSize: small ? 13 : 20,
          fontWeight: 700,
          color: 'var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {flame && (
          <span style={{ color: 'var(--color-wax-red)' }} aria-hidden>
            ◆
          </span>
        )}
        {value}
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'var(--color-sepia)',
          marginTop: 4,
          fontWeight: 600,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {label}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// BigStat — top-of-page stat card (World page)
// ────────────────────────────────────────────────────────────────
export function BigStat({
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <ParchmentCard
      padding={16}
      style={{ textAlign: 'center' }}
    >
      {icon && (
        <div style={{ color: 'var(--color-wax-red)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
          {icon}
        </div>
      )}
      <div
        className="font-mono"
        style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-ink)' }}
      >
        {value}
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'var(--color-sepia)',
          marginTop: 6,
          fontWeight: 600,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {label}
      </div>
    </ParchmentCard>
  )
}

// ────────────────────────────────────────────────────────────────
// CompassRose — decorative NSEW mini-compass
// ────────────────────────────────────────────────────────────────
export function CompassRose({ size = 88 }: { size?: number }) {
  const r1 = size / 2 - 2
  const r2 = size / 2 - 14
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={c} cy={c} r={r1} fill="none" stroke="var(--color-ink)" strokeWidth="1.2" />
      <circle cx={c} cy={c} r={r2} fill="none" stroke="var(--color-sepia)" strokeWidth="0.8" strokeDasharray="2 2" />
      {/* N */}
      <path d={`M${c} ${c - r2 + 2} L${c - 5} ${c} L${c} ${c - 4} L${c + 5} ${c} Z`} fill="var(--color-wax-red)" />
      {/* S */}
      <path d={`M${c} ${c + r2 - 2} L${c - 5} ${c} L${c} ${c + 4} L${c + 5} ${c} Z`} fill="var(--color-sepia)" opacity="0.8" />
      {/* E/W thin */}
      <path d={`M${c - r2 + 2} ${c} L${c} ${c - 4} L${c + 4} ${c} L${c} ${c + 4} Z`} fill="var(--color-sepia-muted)" opacity="0.75" />
      <text
        x={c}
        y={12}
        textAnchor="middle"
        fontFamily="Cinzel"
        fontWeight={700}
        fontSize={10}
        fill="var(--color-wax-red)"
      >
        N
      </text>
      <text x={c} y={size - 4} textAnchor="middle" fontFamily="Cinzel" fontWeight={700} fontSize={10} fill="var(--color-sepia)">
        S
      </text>
      <text x={4} y={c + 4} fontFamily="Cinzel" fontWeight={700} fontSize={10} fill="var(--color-sepia)">
        W
      </text>
      <text x={size - 12} y={c + 4} fontFamily="Cinzel" fontWeight={700} fontSize={10} fill="var(--color-sepia)">
        E
      </text>
      <circle cx={c} cy={c} r="2.4" fill="var(--color-wax-red)" />
    </svg>
  )
}

// ────────────────────────────────────────────────────────────────
// CornerOrnament — small decorative flourish at card corners
// ────────────────────────────────────────────────────────────────
export function CornerOrnament({
  position = 'tl',
  size = 28,
}: {
  position?: 'tl' | 'tr' | 'bl' | 'br'
  size?: number
}) {
  const transform = {
    tl: 'rotate(0)',
    tr: 'scaleX(-1)',
    bl: 'scaleY(-1)',
    br: 'scale(-1, -1)',
  }[position]
  const pos: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    opacity: 0.55,
    pointerEvents: 'none',
    ...(position.includes('t') ? { top: 4 } : { bottom: 4 }),
    ...(position.includes('l') ? { left: 4 } : { right: 4 }),
    transform,
  }
  return (
    <svg viewBox="0 0 24 24" style={pos} aria-hidden>
      <path
        d="M2 2 L2 10 M2 2 L10 2"
        stroke="var(--color-ink)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M4 4 Q8 6 10 10"
        stroke="var(--color-sepia)"
        strokeWidth="0.8"
        fill="none"
      />
      <circle cx="2.5" cy="2.5" r="1" fill="var(--color-wax-red)" />
    </svg>
  )
}

// ────────────────────────────────────────────────────────────────
// RibbonTabs — small horizontal tab row
// ────────────────────────────────────────────────────────────────
export function RibbonTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = '',
  align = 'center',
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  className?: string
  align?: 'start' | 'center'
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        borderBottom: '2px solid rgba(26, 20, 16, 0.25)',
      }}
      role="tablist"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`tab-ribbon ${active === t.id ? 'active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
