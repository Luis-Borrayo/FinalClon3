// src/app/control-de-notas/layout.js
import { redirect } from 'next/navigation'
import { requireServerRole } from '@/lib/server-auth'

export const metadata = {
  title: 'Control de Notas — USPG',
}

export default async function ControlDeNotasLayout({ children }) {
  const { error } = await requireServerRole('ADMIN', 'TEACHER', 'STUDENT')
  if (error) redirect('/login')
  return <>{children}</>
}
