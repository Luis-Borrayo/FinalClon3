'use client'

import { useState } from 'react'

export default function RechazarReservaModal({ reserva, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const dismiss = () => onClose()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await onConfirm(motivo.trim())
    setLoading(false)
  }

  return (
    <div className="lab-modal-overlay" onClick={dismiss} role="presentation">
      <div
        className="lab-modal"
        role="dialog"
        aria-labelledby="rechazar-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="rechazar-title" className="text-xl font-semibold mb-2">
          Rechazar reservación
        </h3>
        {reserva && (
          <p className="text-sm opacity-70 mb-4">
            {reserva.laboratorio?.nombre} — {reserva.usuario?.nombre}{' '}
            {reserva.usuario?.apellido || ''}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase opacity-70 mb-1" htmlFor="motivo-rechazo">
              Motivo (opcional)
            </label>
            <textarea
              id="motivo-rechazo"
              className="lab-input"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Indique el motivo del rechazo para el solicitante..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="lab-btn-ghost" onClick={dismiss} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="lab-btn-primary lab-btn-danger" disabled={loading}>
              {loading ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
