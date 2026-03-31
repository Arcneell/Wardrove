export type TierName = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface TierStyle {
  name: TierName
  label: string
  color: string
  bgColor: string
  borderColor: string
  glowClass: string
}

const TIER_STYLES: Record<number, TierStyle> = {
  1:  { name: 'common',    label: 'Common',     color: '#7a7486', bgColor: 'rgba(122,116,134,0.08)', borderColor: 'rgba(122,116,134,0.25)', glowClass: 'glow-common' },
  2:  { name: 'uncommon',  label: 'Uncommon',   color: '#44d97f', bgColor: 'rgba(68,217,127,0.08)',  borderColor: 'rgba(68,217,127,0.25)',  glowClass: 'glow-uncommon' },
  3:  { name: 'rare',      label: 'Rare',       color: '#3ea8f5', bgColor: 'rgba(62,168,245,0.08)',  borderColor: 'rgba(62,168,245,0.25)',  glowClass: 'glow-rare' },
  4:  { name: 'epic',      label: 'Epic',       color: '#9366e8', bgColor: 'rgba(147,102,232,0.08)', borderColor: 'rgba(147,102,232,0.25)', glowClass: 'glow-epic' },
  5:  { name: 'legendary', label: 'Legendary',  color: '#e8b830', bgColor: 'rgba(232,184,48,0.08)',  borderColor: 'rgba(232,184,48,0.25)',  glowClass: 'glow-legendary' },
  6:  { name: 'mythic',    label: 'Mythic',     color: '#d94089', bgColor: 'rgba(217,64,137,0.08)',  borderColor: 'rgba(217,64,137,0.25)',  glowClass: 'glow-mythic' },
  7:  { name: 'mythic',    label: 'Mythic II',  color: '#d94089', bgColor: 'rgba(217,64,137,0.12)',  borderColor: 'rgba(217,64,137,0.35)',  glowClass: 'glow-mythic' },
  8:  { name: 'mythic',    label: 'Mythic III', color: '#e83050', bgColor: 'rgba(232,48,80,0.12)',   borderColor: 'rgba(232,48,80,0.35)',   glowClass: 'glow-mythic' },
  9:  { name: 'mythic',    label: 'Mythic IV',  color: '#e83050', bgColor: 'rgba(232,48,80,0.15)',   borderColor: 'rgba(232,48,80,0.4)',    glowClass: 'glow-mythic' },
  10: { name: 'mythic',    label: 'Mythic V',   color: '#ff2040', bgColor: 'rgba(255,32,64,0.15)',   borderColor: 'rgba(255,32,64,0.4)',    glowClass: 'glow-mythic' },
}

export function getTierStyle(tier: number): TierStyle {
  return TIER_STYLES[tier] ?? TIER_STYLES[1]
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
