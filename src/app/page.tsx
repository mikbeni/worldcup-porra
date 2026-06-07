import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function HomePage() {
  const cookieStore = cookies()
  const session = cookieStore.get('porra_session')
  if (session) redirect('/dashboard')
  redirect('/login')
}
