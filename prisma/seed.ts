import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEAMS_2026 = [
  // Tier 1 - Favorites
  { name: 'Francia', code: 'FRA', flagEmoji: '', group: 'A', confederation: 'UEFA', tier: 1 },
  { name: 'Brasil', code: 'BRA', flagEmoji: '', group: 'B', confederation: 'CONMEBOL', tier: 1 },
  { name: 'Inglaterra', code: 'ENG', flagEmoji: '', group: 'C', confederation: 'UEFA', tier: 1 },
  { name: 'Argentina', code: 'ARG', flagEmoji: '', group: 'D', confederation: 'CONMEBOL', tier: 1 },
  { name: 'Espaa', code: 'ESP', flagEmoji: '', group: 'E', confederation: 'UEFA', tier: 1 },
  { name: 'Portugal', code: 'POR', flagEmoji: '', group: 'F', confederation: 'UEFA', tier: 1 },
  // Tier 2 - Strong
  { name: 'Alemania', code: 'GER', flagEmoji: '', group: 'A', confederation: 'UEFA', tier: 2 },
  { name: 'Pases Bajos', code: 'NED', flagEmoji: '', group: 'B', confederation: 'UEFA', tier: 2 },
  { name: 'Blgica', code: 'BEL', flagEmoji: '', group: 'C', confederation: 'UEFA', tier: 2 },
  { name: 'Uruguay', code: 'URU', flagEmoji: '', group: 'D', confederation: 'CONMEBOL', tier: 2 },
  { name: 'Colombia', code: 'COL', flagEmoji: '', group: 'E', confederation: 'CONMEBOL', tier: 2 },
  { name: 'Italia', code: 'ITA', flagEmoji: '', group: 'F', confederation: 'UEFA', tier: 2 },
  { name: 'Croacia', code: 'CRO', flagEmoji: '', group: 'G', confederation: 'UEFA', tier: 2 },
  { name: 'Dinamarca', code: 'DEN', flagEmoji: '', group: 'H', confederation: 'UEFA', tier: 2 },
  // Tier 3 - Competitive
  { name: 'Mxico', code: 'MEX', flagEmoji: '', group: 'A', confederation: 'CONCACAF', tier: 3 },
  { name: 'Senegal', code: 'SEN', flagEmoji: '', group: 'B', confederation: 'CAF', tier: 3 },
  { name: 'Marruecos', code: 'MAR', flagEmoji: '', group: 'C', confederation: 'CAF', tier: 3 },
  { name: 'Japn', code: 'JPN', flagEmoji: '', group: 'D', confederation: 'AFC', tier: 3 },
  { name: 'EE.UU.', code: 'USA', flagEmoji: '', group: 'E', confederation: 'CONCACAF', tier: 3 },
  { name: 'Ecuador', code: 'ECU', flagEmoji: '', group: 'F', confederation: 'CONMEBOL', tier: 3 },
  { name: 'Polonia', code: 'POL', flagEmoji: '', group: 'G', confederation: 'UEFA', tier: 3 },
  { name: 'Australia', code: 'AUS', flagEmoji: '', group: 'H', confederation: 'AFC', tier: 3 },
  { name: 'Suiza', code: 'SUI', flagEmoji: '', group: 'A', confederation: 'UEFA', tier: 3 },
  { name: 'Corea del Sur', code: 'KOR', flagEmoji: '', group: 'B', confederation: 'AFC', tier: 3 },
  // Tier 4 - Outsiders
  { name: 'Canad', code: 'CAN', flagEmoji: '', group: 'C', confederation: 'CONCACAF', tier: 4 },
  { name: 'Ghana', code: 'GHA', flagEmoji: '', group: 'D', confederation: 'CAF', tier: 4 },
  { name: 'Costa Rica', code: 'CRC', flagEmoji: '', group: 'E', confederation: 'CONCACAF', tier: 4 },
  { name: 'Tnez', code: 'TUN', flagEmoji: '', group: 'F', confederation: 'CAF', tier: 4 },
  { name: 'Irn', code: 'IRN', flagEmoji: '', group: 'G', confederation: 'AFC', tier: 4 },
  { name: 'Arabia Saud', code: 'KSA', flagEmoji: '', group: 'H', confederation: 'AFC', tier: 4 },
  { name: 'Nigeria', code: 'NGA', flagEmoji: '', group: 'A', confederation: 'CAF', tier: 4 },
  { name: 'Camern', code: 'CMR', flagEmoji: '', group: 'B', confederation: 'CAF', tier: 4 },
]

async function main() {
  console.log(' Seeding database...')

  // Create tournament
  const tournament = await prisma.tournament.upsert({
    where: { slug: 'mundial-2026' },
    update: {},
    create: {
      name: 'Mundial 2026',
      slug: 'mundial-2026',
      year: 2026,
      isActive: true,
      startDate: new Date('2026-06-11'),
      endDate: new Date('2026-07-19'),
    },
  })
  console.log(' Tournament created:', tournament.name)

  // Create tiers
  const tierData = [
    { number: 1, label: 'Favoritos', maxPicks: 1, multiplier: 1.0 },
    { number: 2, label: 'Fuertes', maxPicks: 2, multiplier: 1.5 },
    { number: 3, label: 'Competitivos', maxPicks: 3, multiplier: 2.5 },
    { number: 4, label: 'Outsiders', maxPicks: 4, multiplier: 4.0 },
  ]

  const tiers: Record<number, { id: string }> = {}
  for (const t of tierData) {
    const tier = await prisma.tier.upsert({
      where: { tournamentId_number: { tournamentId: tournament.id, number: t.number } },
      update: {},
      create: { ...t, tournamentId: tournament.id },
    })
    tiers[t.number] = tier
    console.log(` Tier ${t.number} created: ${t.label}`)
  }

  // Create teams
  let teamCount = 0
  for (const teamData of TEAMS_2026) {
    const { tier, ...rest } = teamData
    await prisma.team.upsert({
      where: { id: `${tournament.id}-${teamData.code}` },
      update: {},
      create: {
        id: `${tournament.id}-${teamData.code}`,
        ...rest,
        tournamentId: tournament.id,
        tierId: tiers[tier].id,
      },
    })
    teamCount++
  }
  console.log(` ${teamCount} teams created`)

  // Create sample users
  const users = [
    { username: 'admin', isAdmin: true },
    { username: 'carlos', isAdmin: false },
    { username: 'maria', isAdmin: false },
    { username: 'luis', isAdmin: false },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        isAdmin: u.isAdmin,
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${u.username}`,
      },
    })
  }
  console.log(` ${users.length} sample users created`)

  console.log('\n Seed complete!')
  console.log(' Admin user: admin')
  console.log(' Admin secret (set ADMIN_SECRET env var to override): admin123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
