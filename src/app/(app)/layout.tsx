import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/shared/Navbar'
import { CopyrightNotice } from '@/components/shared/CopyrightNotice'
import { arePicksLocked } from '@/lib/tournament'

async function getUser() {
  const cookieStore = cookies()
  const userId = cookieStore.get('porra_session')?.value
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { locked } = await arePicksLocked()

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh">
      <Navbar user={user} picksLocked={locked} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="max-w-6xl mx-auto px-4 pb-8">
        <CopyrightNotice />
      </footer>
    </div>
  )
}
