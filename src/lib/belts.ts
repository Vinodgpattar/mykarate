/**
 * Belt levels with Kyu information
 * Kyu levels go from 10th (White) down to 1st (Brown 1)
 * Black belt is Dan level (no Kyu)
 */
export const BELT_LEVELS = [
  'White',
  'Yellow',
  'Orange',
  'Green',
  'Blue',
  'Purple',
  'Brown 3',
  'Brown 2',
  'Brown 1',
  'Black',
] as const

export type BeltLevel = typeof BELT_LEVELS[number]

/**
 * Belt colors for UI display
 */
export const BELT_COLORS: Record<string, string> = {
  White: '#FFFFFF',
  Yellow: '#FFEB3B',
  Orange: '#FF9800',
  Green: '#4CAF50',
  Blue: '#2196F3',
  Purple: '#9C27B0',
  'Brown 3': '#8D6E63',
  'Brown 2': '#795548',
  'Brown 1': '#6D4C41',
  Black: '#000000',
}

/**
 * Kyu levels for each belt
 */
export const BELT_KYU: Record<string, string> = {
  White: '10th Kyu',
  Yellow: '9th Kyu',
  Orange: '8th Kyu',
  Green: '7th Kyu',
  Blue: '6th Kyu',
  Purple: '5th Kyu',
  'Brown 3': '3rd Kyu',
  'Brown 2': '2nd Kyu',
  'Brown 1': '1st Kyu',
  Black: 'Dan Level',
}

/**
 * Get belt display name with Kyu
 */
export function getBeltDisplayName(belt: string): string {
  const kyu = BELT_KYU[belt] || ''
  return kyu ? `${belt} (${kyu})` : belt
}

/**
 * Get belt index for sorting/comparison
 */
export function getBeltIndex(belt: string): number {
  return BELT_LEVELS.indexOf(belt as BeltLevel)
}

/**
 * Check if one belt is higher than another
 */
export function isBeltHigher(belt1: string, belt2: string): boolean {
  return getBeltIndex(belt1) > getBeltIndex(belt2)
}

