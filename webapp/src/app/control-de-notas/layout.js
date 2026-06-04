// src/app/control-de-notas/layout.js
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'

export const metadata = {
  title: 'Control de Notas — USPG',
}

export default async function ControlDeNotasLayout({ children }) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
