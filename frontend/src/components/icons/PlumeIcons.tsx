import type { ReactElement, SVGProps } from 'react'

export type PlumeIconKey =
  | 'wifi'
  | 'map'
  | 'shield'
  | 'crown'
  | 'bluetooth'
  | 'radio'
  | 'upload'
  | 'flame'
  | 'lock'
  | 'sword'
  | 'globe'

interface Props extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number
  color?: string
}

const base = (props: Props) => {
  const { size = 40, color = 'currentColor', ...rest } = props
  return {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
}

export const PlumeWifi = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.4}>
      <path d="M32 48 L32 40" />
      <path d="M24 52 L40 52 L36 48 L28 48 Z" />
      <path d="M22 38 Q32 30 42 38" strokeWidth={1.6} />
      <path d="M18 32 Q32 20 46 32" strokeWidth={1.4} />
      <path d="M14 26 Q32 10 50 26" strokeWidth={1.2} />
      <circle cx="32" cy="40" r="2" fill={color} />
      <path d="M16 44 Q20 46 20 50" opacity="0.55" />
      <path d="M48 44 Q44 46 44 50" opacity="0.55" />
      <circle cx="12" cy="24" r="0.8" fill={color} />
      <circle cx="52" cy="24" r="0.8" fill={color} />
    </svg>
  )
}

export const PlumeMap = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.4}>
      <path d="M10 14 Q 32 10 54 14 L 54 50 Q 32 54 10 50 Z" />
      <path d="M10 14 Q 32 18 54 14 M10 50 Q 32 46 54 50" opacity="0.6" />
      <path d="M22 14 L22 50 M42 16 L42 50" opacity="0.45" strokeDasharray="1.5 2" />
      <path d="M30 32 L36 38 M36 32 L30 38" stroke={color} strokeWidth={1.8} />
      <circle cx="16" cy="22" r="3" opacity="0.6" />
      <path d="M16 19 L16 25 M13 22 L19 22" opacity="0.6" />
      <path d="M16 34 Q 22 28 28 32 Q 34 36 40 26" strokeDasharray="2 2" opacity="0.55" />
    </svg>
  )
}

export const PlumeShield = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.5}>
      <path d="M32 8 L52 14 L52 30 Q52 46 32 56 Q12 46 12 30 L12 14 Z" />
      <path d="M32 8 L32 56 M12 32 L52 32" opacity="0.6" />
      <path d="M20 18 L44 18" opacity="0.5" />
      <circle cx="32" cy="32" r="4" fill={color} />
      <circle cx="32" cy="32" r="1.5" fill="#f0e4c8" />
      <path d="M22 24 L26 24 M22 24 L22 28" opacity="0.5" />
      <path d="M42 24 L38 24 M42 24 L42 28" opacity="0.5" />
    </svg>
  )
}

export const PlumeCrown = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.5}>
      <path d="M10 46 L54 46 L54 50 L10 50 Z" />
      <path d="M10 42 L14 22 L22 34 L32 16 L42 34 L50 22 L54 42 Z" />
      <circle cx="14" cy="22" r="2" fill={color} />
      <circle cx="32" cy="16" r="2.2" fill={color} />
      <circle cx="50" cy="22" r="2" fill={color} />
      <path d="M22 42 L22 46 M32 42 L32 46 M42 42 L42 46" opacity="0.5" />
      <circle cx="22" cy="44" r="1.2" fill={color} />
      <circle cx="32" cy="44" r="1.6" fill={color} />
      <circle cx="42" cy="44" r="1.2" fill={color} />
    </svg>
  )
}

export const PlumeBluetooth = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.5}>
      <path d="M16 12 Q 32 8 48 12 L 50 50 Q 32 56 14 50 Z" opacity="0.5" />
      <path d="M24 18 L40 32 L28 44 L28 20 L40 32 L24 46" strokeWidth={2} />
      <path d="M18 22 L18 26 M18 40 L18 44" opacity="0.5" />
      <path d="M46 22 L46 26 M46 40 L46 44" opacity="0.5" />
      <circle cx="28" cy="20" r="1" fill={color} />
      <circle cx="28" cy="44" r="1" fill={color} />
    </svg>
  )
}

export const PlumeRadio = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.5}>
      <path d="M28 52 L36 52 L34 20 L30 20 Z" />
      <path d="M28 52 L22 56 M36 52 L42 56" />
      <path d="M29 34 L35 34 M29 42 L35 42 M29 26 L35 26" opacity="0.55" />
      <circle cx="32" cy="16" r="2" fill={color} />
      <path d="M24 12 Q32 6 40 12" strokeWidth={1.2} />
      <path d="M18 10 Q32 -2 46 10" strokeWidth={1} opacity="0.7" />
      <path d="M16 58 L48 58" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  )
}

export const PlumeUpload = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.4}>
      <path d="M14 20 Q14 14 20 14 L44 14 Q50 14 50 20 L50 44 Q50 50 44 50 L20 50 Q14 50 14 44 Z" />
      <path
        d="M20 14 Q16 14 16 20 Q16 26 20 26 M44 50 Q48 50 48 44 Q48 38 44 38"
        opacity="0.55"
      />
      <path
        d="M22 22 L42 22 M22 28 L38 28 M22 34 L42 34 M22 40 L34 40"
        strokeWidth={0.9}
        opacity="0.55"
      />
      <path d="M38 8 L48 20 L44 22 Z" fill={color} opacity="0.85" />
      <path d="M44 22 L40 28" strokeWidth={1} />
      <circle cx="42" cy="44" r="1.2" fill={color} />
    </svg>
  )
}

export const PlumeFlame = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.5}>
      <path d="M32 10 Q 40 22 42 32 Q 44 44 32 52 Q 20 44 22 32 Q 24 22 32 10 Z" />
      <path
        d="M32 20 Q 36 28 36 36 Q 36 44 32 48 Q 28 44 28 36 Q 28 28 32 20 Z"
        opacity="0.7"
      />
      <path d="M32 32 Q 34 36 32 42 Q 30 36 32 32 Z" fill={color} />
      <path d="M24 52 L40 52" strokeDasharray="1 1" opacity="0.5" />
      <path d="M22 56 L42 56" opacity="0.5" />
      <circle cx="14" cy="24" r="0.8" fill={color} opacity="0.6" />
      <circle cx="50" cy="28" r="0.8" fill={color} opacity="0.6" />
      <circle cx="18" cy="14" r="0.6" fill={color} opacity="0.5" />
      <circle cx="48" cy="18" r="0.6" fill={color} opacity="0.5" />
    </svg>
  )
}

export const PlumeLock = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.6}>
      <path d="M20 28 L20 20 Q20 10 32 10 Q44 10 44 20 L44 28" />
      <path d="M14 28 L50 28 L48 54 L16 54 Z" />
      <path d="M14 28 L16 54 M50 28 L48 54" opacity="0.5" />
      <circle cx="18" cy="32" r="1" fill={color} />
      <circle cx="46" cy="32" r="1" fill={color} />
      <circle cx="18" cy="50" r="1" fill={color} />
      <circle cx="46" cy="50" r="1" fill={color} />
      <circle cx="32" cy="38" r="3" fill={color} />
      <path d="M32 38 L32 46" strokeWidth={2.5} stroke={color} />
    </svg>
  )
}

export const PlumeSword = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.5}>
      <path d="M32 6 L36 42 L32 46 L28 42 Z" />
      <path d="M22 44 L42 44" strokeWidth={2.4} />
      <path d="M30 46 L34 46 L34 54 L30 54 Z" />
      <circle cx="32" cy="58" r="2.4" fill={color} />
      <path d="M32 12 L32 38" opacity="0.35" />
    </svg>
  )
}

export const PlumeGlobe = (props: Props) => {
  const { color = 'currentColor' } = props
  return (
    <svg {...base(props)} strokeWidth={1.4}>
      <circle cx="32" cy="32" r="22" />
      <ellipse cx="32" cy="32" rx="22" ry="10" opacity="0.55" />
      <ellipse cx="32" cy="32" rx="10" ry="22" opacity="0.55" />
      <path d="M10 32 L54 32" />
      <path d="M32 10 L32 54" opacity="0.4" />
      <path d="M20 20 Q32 24 44 20" opacity="0.4" />
      <path d="M20 44 Q32 48 44 44" opacity="0.4" />
      <circle cx="32" cy="32" r="2" fill={color} />
      <circle cx="22" cy="22" r="0.8" fill={color} opacity="0.6" />
      <circle cx="44" cy="40" r="0.8" fill={color} opacity="0.6" />
    </svg>
  )
}

export const PlumeIcons: Record<PlumeIconKey, (props: Props) => ReactElement> = {
  wifi: PlumeWifi,
  map: PlumeMap,
  shield: PlumeShield,
  crown: PlumeCrown,
  bluetooth: PlumeBluetooth,
  radio: PlumeRadio,
  upload: PlumeUpload,
  flame: PlumeFlame,
  lock: PlumeLock,
  sword: PlumeSword,
  globe: PlumeGlobe,
}

export function PlumeIcon({
  name,
  ...rest
}: Props & { name: PlumeIconKey | string | null | undefined }) {
  const Component = (name && (PlumeIcons as Record<string, (p: Props) => ReactElement>)[name]) || PlumeShield
  return <Component {...rest} />
}
