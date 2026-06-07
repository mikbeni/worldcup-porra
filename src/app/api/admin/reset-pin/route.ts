import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user?.isAdmin ? user : null
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { username, newPin } = await request.json()
  if (!username || !/^\d{4}$/.test(newPin)) {
    return NextResponse.json({ error: 'username y newPin (4 dgitos) requeridos' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const hashed = await bcrypt.hash(newPin, 10)
  await prisma.user.update({ where: { id: user.id }, data: { pin: hashed } })

  return NextResponse.json({ ok: true })
}
