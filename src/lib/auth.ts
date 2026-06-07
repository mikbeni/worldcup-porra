import { cookies } from 'next/headers'
import { prisma } from './db'

const SESSION_COOKIE = 'porra_session'
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export async function getSession() {
  const cookieStore = cookies()
  const userId = cookieStore.get(SESSION_COOKIE)?.value
  if (!userId) return null

  const user = await prisma.user.findUnique({ where: { id: userId } })
  return user
}

export async function setSession(userId: string) {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function clearSession() {
  const cookieStore = cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export function generateAvatar(username: string): string {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username)}&backgroundColor=059669,0891b2,7c3aed,dc2626,d97706`
}

export function verifyAdminSecret(secret: string): boolean {
  return secret === ADMIN_SECRET
}
