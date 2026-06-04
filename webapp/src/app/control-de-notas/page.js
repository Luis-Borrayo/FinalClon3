// src/app/control-de-notas/page.js
import { redirect } from 'next/navigation'
import { requireServerRole } from '@/lib/server-auth'

export default async function ControlDeNotasPage() {
  const { user } = await requireServerRole('ADMIN', 'TEACHER', 'STUDENT')

  if (user?.role === 'ADMIN')    redirect('/control-de-notas/Admin')
  if (user?.role === 'TEACHER')  redirect('/control-de-notas/Profesor')
  if (user?.role === 'STUDENT')  redirect('/control-de-notas/Estudiante')

  redirect('/login')
}
