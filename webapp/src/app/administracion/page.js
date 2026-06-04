// src/app/administracion/page.js
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server-auth'
import { getDashboardAdminData } from './actions'
import AdministracionDashboard from './AdministracionDashboard'
import { ToastProvider } from './components/ToastProvider'

export const metadata = {
  title: 'Administración de Espacios — USPG',
}

export default async function AdministracionPage() {
  const user = await getServerUser()
  if (!user || user.role !== 'ADMIN') redirect('/login')

  const data = await getDashboardAdminData()
  return (
    <ToastProvider>
      <AdministracionDashboard initialData={data} />
    </ToastProvider>
  )
}
