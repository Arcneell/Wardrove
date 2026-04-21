export type TierName = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface TierStyle {
  name: TierName
  label: string
  color: string
  bgColor: string
  borderColor: string
  glowClass: string
}

// Parchment palette — matches globals.css tier custom properties.
// Tier numbers 1-10 collapse into 6 visual tiers with a trailing label.
const BASE: Record<TierName, { color: string; glow: string }> = {
  common:    { color: '#6b4820', glow: 'glow-common' },
  uncommon:  { color: '#3d5a2a', glow: 'glow-uncommon' },
  rare:      { color: '#2a4a6b', glow: 'glow-rare' },
  epic:      { color: '#4a2a6b', glow: 'glow-epic' },
  legendary: { color: '#8b6914', glow: 'glow-legendary' },
  mythic:    { color: '#8b1a3a', glow: 'glow-mythic' },
}

const TIER_MAP: Record<number, { name: TierName; label: string }> = {
  1:  { name: 'common',    label: 'Common' },
  2:  { name: 'uncommon',  label: 'Uncommon' },
  3:  { name: 'rare',      label: 'Rare' },
  4:  { name: 'epic',      label: 'Epic' },
  5:  { name: 'legendary', label: 'Legendary' },
  6:  { name: 'mythic',    label: 'Mythic' },
  7:  { name: 'mythic',    label: 'Mythic II' },
  8:  { name: 'mythic',    label: 'Mythic III' },
  9:  { name: 'mythic',    label: 'Mythic IV' },
  10: { name: 'mythic',    label: 'Mythic V' },
}

export function getTierStyle(tier: number): TierStyle {
  const entry = TIER_MAP[tier] ?? TIER_MAP[1]
  const base = BASE[entry.name]
  return {
    name: entry.name,
    label: entry.label,
    color: base.color,
    bgColor: 'var(--color-parchment-light)',
    borderColor: base.color,
    glowClass: base.glow,
  }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    wifi: 'WiFi Discovery',
    bluetooth: 'Bluetooth Hunting',
    cell: 'Tower Defense',
    upload: 'Feed the Machine',
    xp: 'XP Milestones',
    level: 'Level Milestones',
    special: 'Special Ops',
    encryption: 'Security Audit',
  }
  return labels[category] ?? category
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    wifi: 'Wifi',
    bluetooth: 'Bluetooth',
    cell: 'Radio',
    upload: 'Upload',
    xp: 'Star',
    level: 'Trophy',
    special: 'Shield',
    encryption: 'Lock',
  }
  return icons[category] ?? 'Award'
}
