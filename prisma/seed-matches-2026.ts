/**
 * seed-matches-2026.ts
 * Carga los 72 partidos de fase de grupos del Mundial 2026.
 * Fuente: calendario oficial FIFA, actualizado tras el sorteo.
 * Uso: npx tsx prisma/seed-matches-2026.ts
 *
 * IMPORTANTE: ejecutar DESPUES de seed-teams-2026.ts
 */

import { PrismaClient, MatchRound } from '@prisma/client'

const prisma = new PrismaClient()

// Horarios con offset local del estadio. Date los convierte a UTC al guardar.
const GROUP_MATCHES: {
  num: number
  date: string
  home: string
  away: string
  venue: string
  group: string
}[] = [
  { num: 1, date: '2026-06-11T13:00:00-06:00', home: 'MEX', away: 'RSA', venue: 'Estadio Azteca, Ciudad de Mexico', group: 'A' },
  { num: 2, date: '2026-06-11T20:00:00-06:00', home: 'KOR', away: 'CZE', venue: 'Estadio Akron, Guadalajara', group: 'A' },
  { num: 3, date: '2026-06-12T15:00:00-04:00', home: 'CAN', away: 'BIH', venue: 'BMO Field, Toronto', group: 'B' },
  { num: 4, date: '2026-06-12T18:00:00-07:00', home: 'USA', away: 'PAR', venue: 'SoFi Stadium, Los Angeles', group: 'D' },
  { num: 5, date: '2026-06-13T21:00:00-04:00', home: 'HAI', away: 'SCO', venue: 'Gillette Stadium, Boston', group: 'C' },
  { num: 6, date: '2026-06-13T21:00:00-07:00', home: 'AUS', away: 'TUR', venue: 'BC Place, Vancouver', group: 'D' },
  { num: 7, date: '2026-06-13T18:00:00-04:00', home: 'BRA', away: 'MAR', venue: 'MetLife Stadium, New York/New Jersey', group: 'C' },
  { num: 8, date: '2026-06-13T12:00:00-07:00', home: 'QAT', away: 'SUI', venue: "Levi's Stadium, San Francisco Bay Area", group: 'B' },
  { num: 9, date: '2026-06-14T19:00:00-04:00', home: 'CIV', away: 'ECU', venue: 'Lincoln Financial Field, Philadelphia', group: 'E' },
  { num: 10, date: '2026-06-14T12:00:00-05:00', home: 'GER', away: 'CUW', venue: 'NRG Stadium, Houston', group: 'E' },
  { num: 11, date: '2026-06-14T15:00:00-05:00', home: 'NED', away: 'JPN', venue: 'AT&T Stadium, Dallas', group: 'F' },
  { num: 12, date: '2026-06-14T20:00:00-06:00', home: 'SWE', away: 'TUN', venue: 'Estadio BBVA, Monterrey', group: 'F' },
  { num: 13, date: '2026-06-15T18:00:00-04:00', home: 'KSA', away: 'URU', venue: 'Hard Rock Stadium, Miami', group: 'H' },
  { num: 14, date: '2026-06-15T12:00:00-04:00', home: 'ESP', away: 'CPV', venue: 'Mercedes-Benz Stadium, Atlanta', group: 'H' },
  { num: 15, date: '2026-06-15T18:00:00-07:00', home: 'IRN', away: 'NZL', venue: 'SoFi Stadium, Los Angeles', group: 'G' },
  { num: 16, date: '2026-06-15T12:00:00-07:00', home: 'BEL', away: 'EGY', venue: 'Lumen Field, Seattle', group: 'G' },
  { num: 17, date: '2026-06-16T15:00:00-04:00', home: 'FRA', away: 'SEN', venue: 'MetLife Stadium, New York/New Jersey', group: 'I' },
  { num: 18, date: '2026-06-16T18:00:00-04:00', home: 'IRQ', away: 'NOR', venue: 'Gillette Stadium, Boston', group: 'I' },
  { num: 19, date: '2026-06-16T20:00:00-05:00', home: 'ARG', away: 'ALG', venue: 'Arrowhead Stadium, Kansas City', group: 'J' },
  { num: 20, date: '2026-06-16T21:00:00-07:00', home: 'AUT', away: 'JOR', venue: "Levi's Stadium, San Francisco Bay Area", group: 'J' },
  { num: 21, date: '2026-06-17T19:00:00-04:00', home: 'GHA', away: 'PAN', venue: 'BMO Field, Toronto', group: 'L' },
  { num: 22, date: '2026-06-17T15:00:00-05:00', home: 'ENG', away: 'CRO', venue: 'AT&T Stadium, Dallas', group: 'L' },
  { num: 23, date: '2026-06-17T12:00:00-05:00', home: 'POR', away: 'COD', venue: 'NRG Stadium, Houston', group: 'K' },
  { num: 24, date: '2026-06-17T20:00:00-06:00', home: 'UZB', away: 'COL', venue: 'Estadio Azteca, Ciudad de Mexico', group: 'K' },
  { num: 25, date: '2026-06-18T12:00:00-04:00', home: 'CZE', away: 'RSA', venue: 'Mercedes-Benz Stadium, Atlanta', group: 'A' },
  { num: 26, date: '2026-06-18T12:00:00-07:00', home: 'SUI', away: 'BIH', venue: 'SoFi Stadium, Los Angeles', group: 'B' },
  { num: 27, date: '2026-06-18T15:00:00-07:00', home: 'CAN', away: 'QAT', venue: 'BC Place, Vancouver', group: 'B' },
  { num: 28, date: '2026-06-18T19:00:00-06:00', home: 'MEX', away: 'KOR', venue: 'Estadio Akron, Guadalajara', group: 'A' },
  { num: 29, date: '2026-06-19T20:30:00-04:00', home: 'BRA', away: 'HAI', venue: 'Lincoln Financial Field, Philadelphia', group: 'C' },
  { num: 30, date: '2026-06-19T18:00:00-04:00', home: 'SCO', away: 'MAR', venue: 'Gillette Stadium, Boston', group: 'C' },
  { num: 31, date: '2026-06-19T20:00:00-07:00', home: 'TUR', away: 'PAR', venue: "Levi's Stadium, San Francisco Bay Area", group: 'D' },
  { num: 32, date: '2026-06-19T12:00:00-07:00', home: 'USA', away: 'AUS', venue: 'Lumen Field, Seattle', group: 'D' },
  { num: 33, date: '2026-06-20T16:00:00-04:00', home: 'GER', away: 'CIV', venue: 'BMO Field, Toronto', group: 'E' },
  { num: 34, date: '2026-06-20T19:00:00-05:00', home: 'ECU', away: 'CUW', venue: 'Arrowhead Stadium, Kansas City', group: 'E' },
  { num: 35, date: '2026-06-20T12:00:00-05:00', home: 'NED', away: 'SWE', venue: 'NRG Stadium, Houston', group: 'F' },
  { num: 36, date: '2026-06-20T22:00:00-06:00', home: 'TUN', away: 'JPN', venue: 'Estadio BBVA, Monterrey', group: 'F' },
  { num: 37, date: '2026-06-21T18:00:00-04:00', home: 'URU', away: 'CPV', venue: 'Hard Rock Stadium, Miami', group: 'H' },
  { num: 38, date: '2026-06-21T12:00:00-04:00', home: 'ESP', away: 'KSA', venue: 'Mercedes-Benz Stadium, Atlanta', group: 'H' },
  { num: 39, date: '2026-06-21T12:00:00-07:00', home: 'BEL', away: 'IRN', venue: 'SoFi Stadium, Los Angeles', group: 'G' },
  { num: 40, date: '2026-06-21T18:00:00-07:00', home: 'NZL', away: 'EGY', venue: 'BC Place, Vancouver', group: 'G' },
  { num: 41, date: '2026-06-22T20:00:00-04:00', home: 'NOR', away: 'SEN', venue: 'MetLife Stadium, New York/New Jersey', group: 'I' },
  { num: 42, date: '2026-06-22T17:00:00-04:00', home: 'FRA', away: 'IRQ', venue: 'Lincoln Financial Field, Philadelphia', group: 'I' },
  { num: 43, date: '2026-06-22T12:00:00-05:00', home: 'ARG', away: 'AUT', venue: 'AT&T Stadium, Dallas', group: 'J' },
  { num: 44, date: '2026-06-22T20:00:00-07:00', home: 'JOR', away: 'ALG', venue: "Levi's Stadium, San Francisco Bay Area", group: 'J' },
  { num: 45, date: '2026-06-23T16:00:00-04:00', home: 'ENG', away: 'GHA', venue: 'Gillette Stadium, Boston', group: 'L' },
  { num: 46, date: '2026-06-23T19:00:00-04:00', home: 'PAN', away: 'CRO', venue: 'BMO Field, Toronto', group: 'L' },
  { num: 47, date: '2026-06-23T12:00:00-05:00', home: 'POR', away: 'UZB', venue: 'NRG Stadium, Houston', group: 'K' },
  { num: 48, date: '2026-06-23T20:00:00-06:00', home: 'COL', away: 'COD', venue: 'Estadio Akron, Guadalajara', group: 'K' },
  { num: 49, date: '2026-06-24T18:00:00-04:00', home: 'SCO', away: 'BRA', venue: 'Hard Rock Stadium, Miami', group: 'C' },
  { num: 50, date: '2026-06-24T18:00:00-04:00', home: 'MAR', away: 'HAI', venue: 'Mercedes-Benz Stadium, Atlanta', group: 'C' },
  { num: 51, date: '2026-06-24T12:00:00-07:00', home: 'SUI', away: 'CAN', venue: 'BC Place, Vancouver', group: 'B' },
  { num: 52, date: '2026-06-24T12:00:00-07:00', home: 'BIH', away: 'QAT', venue: 'Lumen Field, Seattle', group: 'B' },
  { num: 53, date: '2026-06-24T19:00:00-06:00', home: 'CZE', away: 'MEX', venue: 'Estadio Azteca, Ciudad de Mexico', group: 'A' },
  { num: 54, date: '2026-06-24T19:00:00-06:00', home: 'RSA', away: 'KOR', venue: 'Estadio BBVA, Monterrey', group: 'A' },
  { num: 55, date: '2026-06-25T16:00:00-04:00', home: 'CUW', away: 'CIV', venue: 'Lincoln Financial Field, Philadelphia', group: 'E' },
  { num: 56, date: '2026-06-25T16:00:00-04:00', home: 'ECU', away: 'GER', venue: 'MetLife Stadium, New York/New Jersey', group: 'E' },
  { num: 57, date: '2026-06-25T18:00:00-05:00', home: 'JPN', away: 'SWE', venue: 'AT&T Stadium, Dallas', group: 'F' },
  { num: 58, date: '2026-06-25T18:00:00-05:00', home: 'TUN', away: 'NED', venue: 'Arrowhead Stadium, Kansas City', group: 'F' },
  { num: 59, date: '2026-06-25T19:00:00-07:00', home: 'TUR', away: 'USA', venue: 'SoFi Stadium, Los Angeles', group: 'D' },
  { num: 60, date: '2026-06-25T19:00:00-07:00', home: 'PAR', away: 'AUS', venue: "Levi's Stadium, San Francisco Bay Area", group: 'D' },
  { num: 61, date: '2026-06-26T15:00:00-04:00', home: 'NOR', away: 'FRA', venue: 'Gillette Stadium, Boston', group: 'I' },
  { num: 62, date: '2026-06-26T15:00:00-04:00', home: 'SEN', away: 'IRQ', venue: 'BMO Field, Toronto', group: 'I' },
  { num: 63, date: '2026-06-26T20:00:00-07:00', home: 'EGY', away: 'IRN', venue: 'Lumen Field, Seattle', group: 'G' },
  { num: 64, date: '2026-06-26T20:00:00-07:00', home: 'NZL', away: 'BEL', venue: 'BC Place, Vancouver', group: 'G' },
  { num: 65, date: '2026-06-26T19:00:00-05:00', home: 'CPV', away: 'KSA', venue: 'NRG Stadium, Houston', group: 'H' },
  { num: 66, date: '2026-06-26T18:00:00-06:00', home: 'URU', away: 'ESP', venue: 'Estadio Akron, Guadalajara', group: 'H' },
  { num: 67, date: '2026-06-27T17:00:00-04:00', home: 'PAN', away: 'ENG', venue: 'MetLife Stadium, New York/New Jersey', group: 'L' },
  { num: 68, date: '2026-06-27T17:00:00-04:00', home: 'CRO', away: 'GHA', venue: 'Lincoln Financial Field, Philadelphia', group: 'L' },
  { num: 69, date: '2026-06-27T21:00:00-05:00', home: 'ALG', away: 'AUT', venue: 'Arrowhead Stadium, Kansas City', group: 'J' },
  { num: 70, date: '2026-06-27T21:00:00-05:00', home: 'JOR', away: 'ARG', venue: 'AT&T Stadium, Dallas', group: 'J' },
  { num: 71, date: '2026-06-27T19:30:00-04:00', home: 'COL', away: 'POR', venue: 'Hard Rock Stadium, Miami', group: 'K' },
  { num: 72, date: '2026-06-27T19:30:00-04:00', home: 'COD', away: 'UZB', venue: 'Mercedes-Benz Stadium, Atlanta', group: 'K' },
]

async function main() {
  console.log('Cargando partidos de fase de grupos del Mundial 2026...\n')

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) throw new Error('No hay torneo activo')

  const teams = await prisma.team.findMany({ where: { tournamentId: tournament.id } })
  if (teams.length < 48) {
    throw new Error(`Solo hay ${teams.length} equipos. Ejecuta primero: npx tsx prisma/seed-teams-2026.ts`)
  }
  const teamByCode = new Map(teams.map((t) => [t.code, t]))

  await prisma.match.deleteMany({
    where: { tournamentId: tournament.id, round: MatchRound.GROUP },
  })
  console.log('Partidos de grupos anteriores eliminados\n')

  let count = 0
  let warnings = 0

  for (const m of GROUP_MATCHES) {
    const homeTeam = teamByCode.get(m.home)
    const awayTeam = teamByCode.get(m.away)

    if (!homeTeam) {
      console.warn(`Equipo no encontrado: ${m.home}`)
      warnings++
      continue
    }
    if (!awayTeam) {
      console.warn(`Equipo no encontrado: ${m.away}`)
      warnings++
      continue
    }

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
    process.stdout.write(`\r  ${count}/${GROUP_MATCHES.length} partidos`)
  }

  console.log(`\n\n${count} partidos de fase de grupos cargados`)
  if (warnings > 0) console.log(`${warnings} advertencias (equipos no encontrados)`)
  console.log('\nGrupos A-L con 3 jornadas cada uno')
  console.log('Del 11 al 27 de junio de 2026')
  console.log('\nLos partidos eliminatorios se anadiran desde el panel Admin conforme avance el torneo.')
}

main()
  .catch((e) => {
    console.error('\n', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
