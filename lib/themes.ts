export type ThemeId =
  | 'system'
  | 'paper-light'
  | 'inkwell'
  | 'midnight'
  | 'forest'
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'obsidian'
  | 'sakura'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  swatchBg: string
  swatchPrimary: string
  swatchAccent?: string
  dark: boolean
}

export const THEMES: Theme[] = [
  {
    id: 'system',
    name: 'System',
    description: 'Follows device setting',
    swatchBg: 'linear-gradient(135deg, #faf8f2 50%, #1c1810 50%)',
    swatchPrimary: '#4a3f7a',
    dark: false,
  },
  {
    id: 'paper-light',
    name: 'Paper',
    description: 'Warm parchment, daylight',
    swatchBg: '#faf8f2',
    swatchPrimary: '#4a3f7a',
    dark: false,
  },
  {
    id: 'inkwell',
    name: 'Inkwell',
    description: 'Candlelit sepia dark',
    swatchBg: '#1c1810',
    swatchPrimary: '#9b8fd4',
    dark: true,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Starlit blues and silver',
    swatchBg: '#0c0e1c',
    swatchPrimary: '#818cf8',
    dark: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep emerald, earthy oak',
    swatchBg: '#0c1610',
    swatchPrimary: '#4ade80',
    dark: true,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights, cosmic violet',
    swatchBg: '#080c1a',
    swatchPrimary: '#c084fc',
    swatchAccent: '#2dd4bf',
    dark: true,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Golden hour, warm amber',
    swatchBg: '#fef9f0',
    swatchPrimary: '#b85a00',
    dark: false,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea, twilight blue',
    swatchBg: '#060f1c',
    swatchPrimary: '#22d3ee',
    dark: true,
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    description: 'Pure black, crisp minimal',
    swatchBg: '#0a0a0a',
    swatchPrimary: '#d4d4d4',
    dark: true,
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Cherry blossom, soft pink',
    swatchBg: '#fff5f8',
    swatchPrimary: '#be185d',
    dark: false,
  },
]
