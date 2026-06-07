/**
 * SCORING SYSTEM v2
 *
 * Base Points by Achievement:
 * - Match Win:         3 pts
 * - Match Draw:        2 pts  (was 1)
 * - 1st in Group:      8 pts  (NEW)
 * - 2nd in Group:      4 pts  (NEW)
 * - Round of 16:       5 pts
 * - Quarter-Final:    12 pts  (was 10)
 * - Semi-Final:       20 pts
 * - Final (Runner-up): 30 pts
 * - Champion:         50 pts
 *
 * Tier Multipliers:
 * - Tier 1 (Favorites):    1.0
 * - Tier 2 (Strong):       1.5
 * - Tier 3 (Competitive):  2.5
 * - Tier 4 (Outsiders):    3.0  (was 4.0  too dominant)
 *
 * Max theoretical (3 wins + 1st group + all stages):
 *   T1: ~128  T2: ~192  T3: ~320  T4: ~384
 * Ratio T4/T1 = 3 (was 4)  still rewards risk, doesn't break the game
 */

export const TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.5,
  4: 3.0,
}

export const BASE_POINTS: Record<string, number> = {
  WIN: 3,
  DRAW: 2,
  LOSS: 0,
  GROUP_1ST: 8,
  GROUP_2ND: 4,
  R16: 5,
  QF: 12,
  SF: 20,
  FINAL: 30,
  CHAMPION: 50,
}

export type ScoringReason = keyof typeof BASE_POINTS

export function calculatePoints(reason: ScoringReason, tierNumber: number): number {
  const base = BASE_POINTS[reason] ?? 0
  const multiplier = TIER_MULTIPLIERS[tierNumber] ?? 1.0
  return Math.round(base * multiplier * 10) / 10
}

export function estimateMaxPoints(tierNumber: number): number {
  // 3 group wins + 1st in group + all knockout stages + champion
  return (
    3 * calculatePoints('WIN', tierNumber) +
    calculatePoints('GROUP_1ST', tierNumber) +
    calculatePoints('R16', tierNumber) +
    calculatePoints('QF', tierNumber) +
    calculatePoints('SF', tierNumber) +
    calculatePoints('FINAL', tierNumber) +
    calculatePoints('CHAMPION', tierNumber)
  )
}

export interface ScoringTableRow {
  tier: number
  label: string
  multiplier: number
  win: number
  draw: number
  group1st: number
  group2nd: number
  r16: number
  qf: number
  sf: number
  final: number
  champion: number
  maxPossible: number
}

export function getScoringTable(): ScoringTableRow[] {
  const tierLabels: Record<number, string> = {
    1: 'Favoritos',
    2: 'Fuertes',
    3: 'Competitivos',
    4: 'Outsiders',
  }

  return [1, 2, 3, 4].map((tier) => ({
    tier,
    label: tierLabels[tier],
    multiplier: TIER_MULTIPLIERS[tier],
    win: calculatePoints('WIN', tier),
    draw: calculatePoints('DRAW', tier),
    group1st: calculatePoints('GROUP_1ST', tier),
    group2nd: calculatePoints('GROUP_2ND', tier),
    r16: calculatePoints('R16', tier),
    qf: calculatePoints('QF', tier),
    sf: calculatePoints('SF', tier),
    final: calculatePoints('FINAL', tier),
    champion: calculatePoints('CHAMPION', tier),
    maxPossible: estimateMaxPoints(tier),
  }))
}
