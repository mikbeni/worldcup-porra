import { prisma } from '@/lib/db'
import { GroupsClient } from './GroupsClient'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) return <p className="text-slate-400">No hay torneo activo.</p>

  const teams = await prisma.team.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { group: 'asc' },
  })

  const matches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, round: 'GROUP' },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchNumber: 'asc' }, { scheduledAt: 'asc' }],
  })

  // Build group table data
  type TeamRow = {
    id: string; name: string; code: string; flagEmoji: string
    played: number; won: number; drawn: number; lost: number
    gf: number; ga: number; gd: number; points: number
  }

  const groupMap: Record<string, TeamRow[]> = {}

  for (const team of teams) {
    if (!team.group) continue
    if (!groupMap[team.group]) groupMap[team.group] = []
    groupMap[team.group].push({
      id: team.id, name: team.name, code: team.code, flagEmoji: team.flagEmoji,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    })
  }

  // Calculate stats from finished matches
  for (const match of matches) {
    if (match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) continue
    const group = match.group
    if (!group || !groupMap[group]) continue

    const homeRow = groupMap[group].find((t) => t.id === match.homeTeamId)
    const awayRow = groupMap[group].find((t) => t.id === match.awayTeamId)
    if (!homeRow || !awayRow) continue

    homeRow.played++; awayRow.played++
    homeRow.gf += match.homeScore; homeRow.ga += match.awayScore
    awayRow.gf += match.awayScore; awayRow.ga += match.homeScore

    if (match.homeScore > match.awayScore) {
      homeRow.won++; homeRow.points += 3; awayRow.lost++
    } else if (match.homeScore < match.awayScore) {
      awayRow.won++; awayRow.points += 3; homeRow.lost++
    } else {
      homeRow.drawn++; homeRow.points++; awayRow.drawn++; awayRow.points++
    }
  }

  // Sort each group
  for (const group of Object.keys(groupMap)) {
    groupMap[group].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const gdDiff = (b.gf - b.ga) - (a.gf - a.ga)
      if (gdDiff !== 0) return gdDiff
      return b.gf - a.gf
    })
    groupMap[group].forEach((t) => { t.gd = t.gf - t.ga })
  }

  // Group matches by group letter
  const matchesByGroup: Record<string, typeof matches> = {}
  for (const m of matches) {
    if (!m.group) continue
    if (!matchesByGroup[m.group]) matchesByGroup[m.group] = []
    matchesByGroup[m.group].push(m)
  }

  return (
    <GroupsClient
      groupMap={groupMap}
      matchesByGroup={matchesByGroup}
    />
  )
}
