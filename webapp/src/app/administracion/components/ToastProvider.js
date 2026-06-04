'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function useAdmToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="adm-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast--${t.type}`}>
            <i className={`fa ${t.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
