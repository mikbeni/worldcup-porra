import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { generateAvatar } from '@/lib/auth'
import bcrypt from 'bcryptjs'

function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

// POST /api/auth  login or register
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, pin } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username requerido' }, { status: 400 })
    }
    if (!pin || !validatePin(pin)) {
      return NextResponse.json({ error: 'PIN debe ser exactamente 4 dgitos' }, { status: 400 })
    }

    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (clean.length < 2 || clean.length > 24) {
      return NextResponse.json({ error: 'Username debe tener entre 2 y 24 caracteres' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username: clean } })

    //  Register new user 
    if (!existing) {
      const hashed = await bcrypt.hash(pin, 10)
      const user = await prisma.user.create({
        data: {
          username: clean,
          pin: hashed,
          avatar: generateAvatar(clean),
        },
      })
      const cookieStore = cookies()
      cookieStore.set('porra_session', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      return NextResponse.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin }, created: true })
    }

    //  Existing user: verify PIN 
    // Legacy users (no PIN set yet): accept any PIN and set it
    if (!existing.pin) {
      const hashed = await bcrypt.hash(pin, 10)
      await prisma.user.update({ where: { id: existing.id }, data: { pin: hashed } })
    } else {
      const valid = await bcrypt.compare(pin, existing.pin)
      if (!valid) {
        return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
      }
    }

    const cookieStore = cookies()
    cookieStore.set('porra_session', existing.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return NextResponse.json({ user: { id: existing.id, username: existing.username, isAdmin: existing.isAdmin }, created: false })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete('porra_session')
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) return NextResponse.json({ user: null })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return NextResponse.json({ user })
}
