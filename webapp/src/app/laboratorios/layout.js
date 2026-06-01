import './laboratorios.css'
import { ToastProvider } from './components/ToastProvider'

export default function LaboratoriosLayout({ children }) {
  return <ToastProvider>{children}</ToastProvider>
}
