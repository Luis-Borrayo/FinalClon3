'use client'

import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    if (typeof message !== 'string' || !message.trim()) return
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="lab-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`lab-toast lab-toast--${t.type}`} role="status">
            <i className={`fa ${t.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useLabToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useLabToast debe usarse dentro de ToastProvider')
  return ctx
}
