import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { generateAvatar } from '@/lib/auth'

export const dynamic = 'force-dynamic'



export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, createIfNew = true } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username requerido' }, { status: 400 })
    }

    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (clean.length < 2 || clean.length > 24) {
      return NextResponse.json({ error: 'Username debe tener entre 2 y 24 caracteres' }, { status: 400 })
    }

    let user = await prisma.user.findUnique({ where: { username: clean } })
    let created = false

    if (!user) {
      if (!createIfNew) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
      user = await prisma.user.create({
        data: {
          username: clean,
          avatar: generateAvatar(clean),
        },
      })
      created = true
    }

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set('porra_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return NextResponse.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin }, created })
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
