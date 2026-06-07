import { prisma } from './db'

/**
 * Returns whether picks are locked (tournament has started = first match is in the past)
 */
export async function arePicksLocked(): Promise<{ locked: boolean; firstMatch: Date | null }> {
  const firstMatch = await prisma.match.findFirst({
    orderBy: { scheduledAt: 'asc' },
  })
  if (!firstMatch) return { locked: false, firstMatch: null }
  const locked = new Date() >= firstMatch.scheduledAt
  return { locked, firstMatch: firstMatch.scheduledAt }
}
