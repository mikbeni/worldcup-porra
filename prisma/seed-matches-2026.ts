/**
 * seed-matches-2026.ts
 * Carga los 48 partidos de fase de grupos del Mundial 2026
 * Fuente: FIFA oficial / bracketmundial2026.com
 * Uso: npx tsx prisma/seed-matches-2026.ts
 *
 * IMPORTANTE: ejecutar DESPUÉS de seed-teams-2026.ts
 */

import { PrismaClient, MatchRound } from '@prisma/client'

const prisma = new PrismaClient()

// Horarios en UTC (ET+4 en verano)
// 12:00 ET = 16:00 UTC | 15:00 ET = 19:00 UTC | 21:00 ET = 01:00 UTC+1
const GROUP_MATCHES: {
  num: number; date: string; home: string; away: string; venue: string; group: string
}[] = [
  // ── JORNADA 1 ──
  { num: 1,  date: '2026-06-11T19:00:00Z', home: 'MEX', away: 'RSA', venue: 'Estadio Azteca, Ciudad de México',        group: 'A' },
  { num: 2,  date: '2026-06-11T02:00:00Z', home: 'KOR', away: 'CZE', venue: 'Estadio Akron, Guadalajara',              group: 'A' },
  { num: 3,  date: '2026-06-12T01:00:00Z', home: 'USA', away: 'PAR', venue: 'MetLife Stadium, Nueva York',             group: 'D' },
  { num: 4,  date: '2026-06-12T20:00:00Z', home: 'CAN', away: 'QAT', venue: 'BC Place, Vancouver',                    group: 'B' },
  { num: 5,  date: '2026-06-13T22:00:00Z', home: 'BRA', away: 'MAR', venue: 'SoFi Stadium, Los Ángeles',              group: 'C' },
  { num: 6,  date: '2026-06-13T16:00:00Z', home: 'SUI', away: 'BIH', venue: 'Gillette Stadium, Boston',               group: 'B' },
  { num: 7,  date: '2026-06-14T17:00:00Z', home: 'GER', away: 'CUW', venue: 'AT&T Stadium, Dallas',                   group: 'E' },
  { num: 8,  date: '2026-06-14T20:00:00Z', home: 'NED', away: 'JPN', venue: 'Levi\'s Stadium, San Francisco',         group: 'F' },
  { num: 9,  date: '2026-06-14T02:00:00Z', home: 'AUS', away: 'TUR', venue: 'Arrowhead Stadium, Kansas City',         group: 'D' },
  { num: 10, date: '2026-06-15T16:00:00Z', home: 'ESP', away: 'CPV', venue: 'Rose Bowl, Los Ángeles',                 group: 'H' },
  { num: 11, date: '2026-06-15T22:00:00Z', home: 'URU', away: 'KSA', venue: 'Hard Rock Stadium, Miami',               group: 'H' },
  { num: 12, date: '2026-06-15T19:00:00Z', home: 'HAI', away: 'SCO', venue: 'Lincoln Financial Field, Filadelfia',    group: 'C' },
  { num: 13, date: '2026-06-16T19:00:00Z', home: 'FRA', away: 'SEN', venue: 'NRG Stadium, Houston',                   group: 'I' },
  { num: 14, date: '2026-06-16T22:00:00Z', home: 'CIV', away: 'ECU', venue: 'Estadio Universitario, Monterrey',       group: 'E' },
  { num: 15, date: '2026-06-16T01:00:00Z', home: 'ARG', away: 'ALG', venue: 'MetLife Stadium, Nueva York',            group: 'J' },
  { num: 16, date: '2026-06-17T20:00:00Z', home: 'ENG', away: 'CRO', venue: 'AT&T Stadium, Dallas',                   group: 'L' },
  { num: 17, date: '2026-06-17T17:00:00Z', home: 'POR', away: 'COD', venue: 'Levi\'s Stadium, San Francisco',         group: 'K' },
  { num: 18, date: '2026-06-17T02:00:00Z', home: 'COL', away: 'UZB', venue: 'SoFi Stadium, Los Ángeles',              group: 'K' },
  { num: 19, date: '2026-06-18T16:00:00Z', home: 'BEL', away: 'EGY', venue: 'Lincoln Financial Field, Filadelfia',    group: 'G' },
  { num: 20, date: '2026-06-18T22:00:00Z', home: 'IRN', away: 'NZL', venue: 'BC Place, Vancouver',                    group: 'G' },
  { num: 21, date: '2026-06-18T19:00:00Z', home: 'TUN', away: 'SWE', venue: 'Arrowhead Stadium, Kansas City',         group: 'F' },
  { num: 22, date: '2026-06-19T16:00:00Z', home: 'NOR', away: 'IRQ', venue: 'Gillette Stadium, Boston',               group: 'I' },
  { num: 23, date: '2026-06-19T22:00:00Z', home: 'AUT', away: 'JOR', venue: 'Hard Rock Stadium, Miami',               group: 'J' },
  { num: 24, date: '2026-06-19T19:00:00Z', home: 'GHA', away: 'PAN', venue: 'NRG Stadium, Houston',                   group: 'L' },

  // ── JORNADA 2 ──
  { num: 25, date: '2026-06-20T16:00:00Z', home: 'MEX', away: 'CZE', venue: 'Estadio Azteca, Ciudad de México',       group: 'A' },
  { num: 26, date: '2026-06-20T22:00:00Z', home: 'KOR', away: 'RSA', venue: 'Estadio Akron, Guadalajara',             group: 'A' },
  { num: 27, date: '2026-06-20T19:00:00Z', home: 'USA', away: 'AUS', venue: 'SoFi Stadium, Los Ángeles',              group: 'D' },
  { num: 28, date: '2026-06-21T16:00:00Z', home: 'CAN', away: 'SUI', venue: 'BC Place, Vancouver',                    group: 'B' },
  { num: 29, date: '2026-06-21T22:00:00Z', home: 'QAT', away: 'BIH', venue: 'Gillette Stadium, Boston',               group: 'B' },
  { num: 30, date: '2026-06-21T19:00:00Z', home: 'BRA', away: 'SCO', venue: 'AT&T Stadium, Dallas',                   group: 'C' },
  { num: 31, date: '2026-06-22T16:00:00Z', home: 'MAR', away: 'HAI', venue: 'Rose Bowl, Los Ángeles',                 group: 'C' },
  { num: 32, date: '2026-06-22T22:00:00Z', home: 'GER', away: 'ECU', venue: 'Arrowhead Stadium, Kansas City',         group: 'E' },
  { num: 33, date: '2026-06-22T19:00:00Z', home: 'CUW', away: 'CIV', venue: 'Lincoln Financial Field, Filadelfia',    group: 'E' },
  { num: 34, date: '2026-06-23T16:00:00Z', home: 'ESP', away: 'URU', venue: 'Hard Rock Stadium, Miami',               group: 'H' },
  { num: 35, date: '2026-06-23T22:00:00Z', home: 'KSA', away: 'CPV', venue: 'NRG Stadium, Houston',                   group: 'H' },
  { num: 36, date: '2026-06-23T19:00:00Z', home: 'NED', away: 'SWE', venue: 'MetLife Stadium, Nueva York',            group: 'F' },
  { num: 37, date: '2026-06-24T16:00:00Z', home: 'JPN', away: 'TUN', venue: 'Levi\'s Stadium, San Francisco',         group: 'F' },
  { num: 38, date: '2026-06-24T22:00:00Z', home: 'PAR', away: 'TUR', venue: 'AT&T Stadium, Dallas',                   group: 'D' },
  { num: 39, date: '2026-06-24T19:00:00Z', home: 'FRA', away: 'IRQ', venue: 'Estadio Universitario, Monterrey',       group: 'I' },
  { num: 40, date: '2026-06-25T16:00:00Z', home: 'SEN', away: 'NOR', venue: 'Gillette Stadium, Boston',               group: 'I' },
  { num: 41, date: '2026-06-25T22:00:00Z', home: 'ARG', away: 'AUT', venue: 'Hard Rock Stadium, Miami',               group: 'J' },
  { num: 42, date: '2026-06-25T19:00:00Z', home: 'ALG', away: 'JOR', venue: 'Lincoln Financial Field, Filadelfia',    group: 'J' },
  { num: 43, date: '2026-06-25T16:00:00Z', home: 'BEL', away: 'NZL', venue: 'NRG Stadium, Houston',                   group: 'G' },
  { num: 44, date: '2026-06-25T22:00:00Z', home: 'EGY', away: 'IRN', venue: 'MetLife Stadium, Nueva York',            group: 'G' },
  { num: 45, date: '2026-06-26T19:00:00Z', home: 'POR', away: 'UZB', venue: 'Rose Bowl, Los Ángeles',                 group: 'K' },
  { num: 46, date: '2026-06-26T16:00:00Z', home: 'COL', away: 'COD', venue: 'BC Place, Vancouver',                    group: 'K' },
  { num: 47, date: '2026-06-26T22:00:00Z', home: 'ENG', away: 'GHA', venue: 'AT&T Stadium, Dallas',                   group: 'L' },
  { num: 48, date: '2026-06-26T19:00:00Z', home: 'CRO', away: 'PAN', venue: 'Arrowhead Stadium, Kansas City',         group: 'L' },

  // ── JORNADA 3 (simultáneos por grupo) ──
  { num: 49, date: '2026-06-27T20:00:00Z', home: 'MEX', away: 'KOR', venue: 'Estadio Azteca, Ciudad de México',       group: 'A' },
  { num: 50, date: '2026-06-27T20:00:00Z', home: 'RSA', away: 'CZE', venue: 'Estadio Akron, Guadalajara',             group: 'A' },
  { num: 51, date: '2026-06-27T16:00:00Z', home: 'CAN', away: 'BIH', venue: 'BC Place, Vancouver',                    group: 'B' },
  { num: 52, date: '2026-06-27T16:00:00Z', home: 'SUI', away: 'QAT', venue: 'Gillette Stadium, Boston',               group: 'B' },
  { num: 53, date: '2026-06-28T20:00:00Z', home: 'BRA', away: 'HAI', venue: 'SoFi Stadium, Los Ángeles',              group: 'C' },
  { num: 54, date: '2026-06-28T20:00:00Z', home: 'MAR', away: 'SCO', venue: 'AT&T Stadium, Dallas',                   group: 'C' },
  { num: 55, date: '2026-06-28T16:00:00Z', home: 'USA', away: 'TUR', venue: 'MetLife Stadium, Nueva York',            group: 'D' },
  { num: 56, date: '2026-06-28T16:00:00Z', home: 'PAR', away: 'AUS', venue: 'Arrowhead Stadium, Kansas City',         group: 'D' },
  { num: 57, date: '2026-06-29T20:00:00Z', home: 'GER', away: 'CIV', venue: 'Estadio Universitario, Monterrey',       group: 'E' },
  { num: 58, date: '2026-06-29T20:00:00Z', home: 'ECU', away: 'CUW', venue: 'Rose Bowl, Los Ángeles',                 group: 'E' },
  { num: 59, date: '2026-06-29T16:00:00Z', home: 'NED', away: 'TUN', venue: 'Levi\'s Stadium, San Francisco',         group: 'F' },
  { num: 60, date: '2026-06-29T16:00:00Z', home: 'SWE', away: 'JPN', venue: 'Lincoln Financial Field, Filadelfia',    group: 'F' },
  { num: 61, date: '2026-06-30T20:00:00Z', home: 'BEL', away: 'IRN', venue: 'NRG Stadium, Houston',                   group: 'G' },
  { num: 62, date: '2026-06-30T20:00:00Z', home: 'EGY', away: 'NZL', venue: 'Hard Rock Stadium, Miami',               group: 'G' },
  { num: 63, date: '2026-06-30T16:00:00Z', home: 'ESP', away: 'KSA', venue: 'BC Place, Vancouver',                    group: 'H' },
  { num: 64, date: '2026-06-30T16:00:00Z', home: 'URU', away: 'CPV', venue: 'Gillette Stadium, Boston',               group: 'H' },
  { num: 65, date: '2026-07-01T20:00:00Z', home: 'FRA', away: 'NOR', venue: 'AT&T Stadium, Dallas',                   group: 'I' },
  { num: 66, date: '2026-07-01T20:00:00Z', home: 'IRQ', away: 'SEN', venue: 'MetLife Stadium, Nueva York',            group: 'I' },
  { num: 67, date: '2026-07-01T16:00:00Z', home: 'ARG', away: 'JOR', venue: 'SoFi Stadium, Los Ángeles',              group: 'J' },
  { num: 68, date: '2026-07-01T16:00:00Z', home: 'AUT', away: 'ALG', venue: 'Rose Bowl, Los Ángeles',                 group: 'J' },
  { num: 69, date: '2026-07-02T20:00:00Z', home: 'POR', away: 'COL', venue: 'Arrowhead Stadium, Kansas City',         group: 'K' },
  { num: 70, date: '2026-07-02T20:00:00Z', home: 'COD', away: 'UZB', venue: 'Lincoln Financial Field, Filadelfia',    group: 'K' },
  { num: 71, date: '2026-07-02T16:00:00Z', home: 'ENG', away: 'PAN', venue: 'NRG Stadium, Houston',                   group: 'L' },
  { num: 72, date: '2026-07-02T16:00:00Z', home: 'CRO', away: 'GHA', venue: 'Hard Rock Stadium, Miami',               group: 'L' },
]

async function main() {
  console.log('📅 Cargando partidos de fase de grupos del Mundial 2026...\n')

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) throw new Error('No hay torneo activo')

  // Build team lookup map
  const teams = await prisma.team.findMany({ where: { tournamentId: tournament.id } })
  if (teams.length < 48) {
    throw new Error(`Solo hay ${teams.length} equipos. Ejecuta primero: npx tsx prisma/seed-teams-2026.ts`)
  }
  const teamByCode = new Map(teams.map((t) => [t.code, t]))

  // Delete existing group matches
  await prisma.match.deleteMany({
    where: { tournamentId: tournament.id, round: MatchRound.GROUP },
  })
  console.log('🗑️  Partidos de grupos anteriores eliminados\n')

  let count = 0
  let warnings = 0

  for (const m of GROUP_MATCHES) {
    const homeTeam = teamByCode.get(m.home)
    const awayTeam = teamByCode.get(m.away)

    if (!homeTeam) { console.warn(`⚠️  Equipo no encontrado: ${m.home}`); warnings++; continue }
    if (!awayTeam) { console.warn(`⚠️  Equipo no encontrado: ${m.away}`); warnings++; continue }

    await prisma.match.create({
      data: {
        matchNumber: m.num,
        round: MatchRound.GROUP,
        group: m.group,
        scheduledAt: new Date(m.date),
        venue: m.venue,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        tournamentId: tournament.id,
      },
    })
    count++
    process.stdout.write(`\r  ✓ ${count}/${GROUP_MATCHES.length} partidos`)
  }

  console.log(`\n\n✅ ${count} partidos de fase de grupos cargados`)
  if (warnings > 0) console.log(`⚠️  ${warnings} advertencias (equipos no encontrados)`)
  console.log('\n📋 Grupos A–L con 3 jornadas cada uno')
  console.log('🗓️  Del 11 de junio al 2 de julio de 2026')
  console.log('\n👉 Los partidos eliminatorios se añadirán desde el panel Admin conforme avance el torneo.')
}

main()
  .catch((e) => { console.error('\n❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
