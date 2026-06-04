// src/app/control-de-notas/page.js
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'

export default async function ControlDeNotasPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  if (user.role === 'ADMIN')   redirect('/control-de-notas/Admin')
  if (user.role === 'TEACHER') redirect('/control-de-notas/Profesor')
  if (user.role === 'STUDENT') redirect('/control-de-notas/Estudiante')

  redirect('/login')
}
