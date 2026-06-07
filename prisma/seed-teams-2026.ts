/**
 * seed-teams-2026.ts
 * Reemplaza todos los equipos con los 48 clasificados reales al Mundial 2026
 * Uso: npx tsx prisma/seed-teams-2026.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 48 equipos oficiales FIFA World Cup 2026
// Tiers asignados por ranking FIFA y rendimiento histórico
const TEAMS: {
  name: string; code: string; flagEmoji: string
  group: string; confederation: string; tier: number
}[] = [
  // ── GRUPO A ──
  { name: 'México',         code: 'MEX', flagEmoji: '🇲🇽', group: 'A', confederation: 'CONCACAF', tier: 2 },
  { name: 'Sudáfrica',      code: 'RSA', flagEmoji: '🇿🇦', group: 'A', confederation: 'CAF',      tier: 4 },
  { name: 'Corea del Sur',  code: 'KOR', flagEmoji: '🇰🇷', group: 'A', confederation: 'AFC',      tier: 3 },
  { name: 'Chequia',        code: 'CZE', flagEmoji: '🇨🇿', group: 'A', confederation: 'UEFA',     tier: 3 },
  // ── GRUPO B ──
  { name: 'Canadá',         code: 'CAN', flagEmoji: '🇨🇦', group: 'B', confederation: 'CONCACAF', tier: 3 },
  { name: 'Qatar',          code: 'QAT', flagEmoji: '🇶🇦', group: 'B', confederation: 'AFC',      tier: 4 },
  { name: 'Suiza',          code: 'SUI', flagEmoji: '🇨🇭', group: 'B', confederation: 'UEFA',     tier: 3 },
  { name: 'Bosnia',         code: 'BIH', flagEmoji: '🇧🇦', group: 'B', confederation: 'UEFA',     tier: 4 },
  // ── GRUPO C ──
  { name: 'Brasil',         code: 'BRA', flagEmoji: '🇧🇷', group: 'C', confederation: 'CONMEBOL', tier: 1 },
  { name: 'Marruecos',      code: 'MAR', flagEmoji: '🇲🇦', group: 'C', confederation: 'CAF',      tier: 2 },
  { name: 'Haití',          code: 'HAI', flagEmoji: '🇭🇹', group: 'C', confederation: 'CONCACAF', tier: 4 },
  { name: 'Escocia',        code: 'SCO', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', confederation: 'UEFA',     tier: 4 },
  // ── GRUPO D ──
  { name: 'EE.UU.',         code: 'USA', flagEmoji: '🇺🇸', group: 'D', confederation: 'CONCACAF', tier: 2 },
  { name: 'Paraguay',       code: 'PAR', flagEmoji: '🇵🇾', group: 'D', confederation: 'CONMEBOL', tier: 4 },
  { name: 'Australia',      code: 'AUS', flagEmoji: '🇦🇺', group: 'D', confederation: 'AFC',      tier: 3 },
  { name: 'Turquía',        code: 'TUR', flagEmoji: '🇹🇷', group: 'D', confederation: 'UEFA',     tier: 3 },
  // ── GRUPO E ──
  { name: 'Alemania',       code: 'GER', flagEmoji: '🇩🇪', group: 'E', confederation: 'UEFA',     tier: 1 },
  { name: 'Curazao',        code: 'CUW', flagEmoji: '🇨🇼', group: 'E', confederation: 'CONCACAF', tier: 4 },
  { name: 'Costa de Marfil',code: 'CIV', flagEmoji: '🇨🇮', group: 'E', confederation: 'CAF',      tier: 3 },
  { name: 'Ecuador',        code: 'ECU', flagEmoji: '🇪🇨', group: 'E', confederation: 'CONMEBOL', tier: 3 },
  // ── GRUPO F ──
  { name: 'Países Bajos',   code: 'NED', flagEmoji: '🇳🇱', group: 'F', confederation: 'UEFA',     tier: 1 },
  { name: 'Japón',          code: 'JPN', flagEmoji: '🇯🇵', group: 'F', confederation: 'AFC',      tier: 2 },
  { name: 'Túnez',          code: 'TUN', flagEmoji: '🇹🇳', group: 'F', confederation: 'CAF',      tier: 4 },
  { name: 'Suecia',         code: 'SWE', flagEmoji: '🇸🇪', group: 'F', confederation: 'UEFA',     tier: 3 },
  // ── GRUPO G ──
  { name: 'Bélgica',        code: 'BEL', flagEmoji: '🇧🇪', group: 'G', confederation: 'UEFA',     tier: 2 },
  { name: 'Egipto',         code: 'EGY', flagEmoji: '🇪🇬', group: 'G', confederation: 'CAF',      tier: 3 },
  { name: 'Irán',           code: 'IRN', flagEmoji: '🇮🇷', group: 'G', confederation: 'AFC',      tier: 4 },
  { name: 'Nueva Zelanda',  code: 'NZL', flagEmoji: '🇳🇿', group: 'G', confederation: 'OFC',      tier: 4 },
  // ── GRUPO H ──
  { name: 'España',         code: 'ESP', flagEmoji: '🇪🇸', group: 'H', confederation: 'UEFA',     tier: 1 },
  { name: 'Cabo Verde',     code: 'CPV', flagEmoji: '🇨🇻', group: 'H', confederation: 'CAF',      tier: 4 },
  { name: 'Arabia Saudita', code: 'KSA', flagEmoji: '🇸🇦', group: 'H', confederation: 'AFC',      tier: 4 },
  { name: 'Uruguay',        code: 'URU', flagEmoji: '🇺🇾', group: 'H', confederation: 'CONMEBOL', tier: 2 },
  // ── GRUPO I ──
  { name: 'Francia',        code: 'FRA', flagEmoji: '🇫🇷', group: 'I', confederation: 'UEFA',     tier: 1 },
  { name: 'Senegal',        code: 'SEN', flagEmoji: '🇸🇳', group: 'I', confederation: 'CAF',      tier: 2 },
  { name: 'Noruega',        code: 'NOR', flagEmoji: '🇳🇴', group: 'I', confederation: 'UEFA',     tier: 3 },
  { name: 'Iraq',           code: 'IRQ', flagEmoji: '🇮🇶', group: 'I', confederation: 'AFC',      tier: 4 },
  // ── GRUPO J ──
  { name: 'Argentina',      code: 'ARG', flagEmoji: '🇦🇷', group: 'J', confederation: 'CONMEBOL', tier: 1 },
  { name: 'Argelia',        code: 'ALG', flagEmoji: '🇩🇿', group: 'J', confederation: 'CAF',      tier: 3 },
  { name: 'Austria',        code: 'AUT', flagEmoji: '🇦🇹', group: 'J', confederation: 'UEFA',     tier: 3 },
  { name: 'Jordania',       code: 'JOR', flagEmoji: '🇯🇴', group: 'J', confederation: 'AFC',      tier: 4 },
  // ── GRUPO K ──
  { name: 'Portugal',       code: 'POR', flagEmoji: '🇵🇹', group: 'K', confederation: 'UEFA',     tier: 1 },
  { name: 'Colombia',       code: 'COL', flagEmoji: '🇨🇴', group: 'K', confederation: 'CONMEBOL', tier: 2 },
  { name: 'Uzbekistán',     code: 'UZB', flagEmoji: '🇺🇿', group: 'K', confederation: 'AFC',      tier: 4 },
  { name: 'DR Congo',       code: 'COD', flagEmoji: '🇨🇩', group: 'K', confederation: 'CAF',      tier: 4 },
  // ── GRUPO L ──
  { name: 'Inglaterra',     code: 'ENG', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', confederation: 'UEFA',     tier: 1 },
  { name: 'Croacia',        code: 'CRO', flagEmoji: '🇭🇷', group: 'L', confederation: 'UEFA',     tier: 2 },
  { name: 'Ghana',          code: 'GHA', flagEmoji: '🇬🇭', group: 'L', confederation: 'CAF',      tier: 4 },
  { name: 'Panamá',         code: 'PAN', flagEmoji: '🇵🇦', group: 'L', confederation: 'CONCACAF', tier: 4 },
]

async function main() {
  console.log('🌍 Actualizando equipos del Mundial 2026...\n')

  const tournament = await prisma.tournament.findFirst({ where: { isActive: true } })
  if (!tournament) throw new Error('No hay torneo activo. Ejecuta primero npm run db:seed')

  const tiers = await prisma.tier.findMany({ where: { tournamentId: tournament.id } })
  const tierMap = new Map(tiers.map((t) => [t.number, t]))

  // Borrar equipos viejos y sus picks/partidos relacionados
  console.log('🗑️  Limpiando equipos anteriores...')
  await prisma.pick.deleteMany({})
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } })
  await prisma.team.deleteMany({ where: { tournamentId: tournament.id } })

  // Insertar los 48 equipos reales
  let count = 0
  for (const t of TEAMS) {
    const tier = tierMap.get(t.tier)
    if (!tier) { console.warn(`⚠️  Tier ${t.tier} no encontrado`); continue }

    await prisma.team.create({
      data: {
        id: `${tournament.id}-${t.code}`,
        name: t.name,
        code: t.code,
        flagEmoji: t.flagEmoji,
        group: t.group,
        confederation: t.confederation,
        tournamentId: tournament.id,
        tierId: tier.id,
      },
    })
    count++
    process.stdout.write(`\r  ✓ ${count}/48 equipos`)
  }

  console.log(`\n\n✅ ${count} equipos cargados correctamente`)
  console.log('\n⚠️  Los picks de usuarios han sido borrados (los equipos cambiaron).')
  console.log('   Pide a los participantes que vuelvan a hacer sus selecciones.\n')
  console.log('👉 Ejecuta ahora: npx tsx prisma/seed-matches-2026.ts')
}

main()
  .catch((e) => { console.error('\n❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
