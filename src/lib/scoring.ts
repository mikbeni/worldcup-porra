/**
 * SCORING SYSTEM
 * 
 * Base Points by Achievement:
 * - Match Win:       3 pts
 * - Match Draw:      1 pt
 * - Round of 16:     5 pts
 * - Quarter-Final:   10 pts
 * - Semi-Final:      20 pts
 * - Final (Runner):  30 pts
 * - Champion:        50 pts
 *
 * Tier Multipliers (to reward picking underdogs):
 * - Tier 1 (Favorites):    ×1.0
 * - Tier 2 (Strong):       ×1.5
 * - Tier 3 (Competitive):  ×2.5
 * - Tier 4 (Outsiders):    ×4.0
 *
 * Example: Tier 4 team wins group + reaches QF:
 *   (3+3+3 wins) × 4.0 + (5 R16 + 10 QF) × 4.0 = 36 + 60 = 96 pts
 */

export const TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.5,
  4: 4.0,
}

export const BASE_POINTS: Record<string, number> = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
  R16: 5,
  QF: 10,
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

export interface TeamPerformanceSummary {
  teamCode: string
  tierNumber: number
  matchWins: number
  matchDraws: number
  stage: string
  totalPoints: number
}

export function estimateMaxPoints(tierNumber: number): number {
  // 3 group wins + R16 + QF + SF + Final + Champion
  const wins = 3 * calculatePoints('WIN', tierNumber)
  const stages =
    calculatePoints('R16', tierNumber) +
    calculatePoints('QF', tierNumber) +
    calculatePoints('SF', tierNumber) +
    calculatePoints('FINAL', tierNumber) +
    calculatePoints('CHAMPION', tierNumber)
  return wins + stages
}

export interface ScoringTableRow {
  tier: number
  label: string
  multiplier: number
  win: number
  draw: number
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
    r16: calculatePoints('R16', tier),
    qf: calculatePoints('QF', tier),
    sf: calculatePoints('SF', tier),
    final: calculatePoints('FINAL', tier),
    champion: calculatePoints('CHAMPION', tier),
    maxPossible: estimateMaxPoints(tier),
  }))
}
