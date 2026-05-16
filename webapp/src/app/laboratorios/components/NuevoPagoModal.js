'use client'

import { useState } from 'react'
import { registrarPago } from '../actions'

const TIPOS_COBRO = [
  { value: 'CUOTA_SEMESTRAL', label: 'Cuota semestral' },
  { value: 'PAGO_HORA', label: 'Pago por hora' },
  { value: 'PAGO_DIA', label: 'Pago por día' },
  { value: 'PAGO_SEMESTRE', label: 'Pago por semestre' },
  { value: 'RESERVACION_GRUPO', label: 'Reservación de grupo' },
]

export default function NuevoPagoModal({ laboratorios, usuarios, onClose = () => {} }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dismiss = () => onClose()

  async function handleSubmit(formData) {
    setLoading(true)
    setError('')
    const result = await registrarPago(formData)
    if (result?.success) {
      onClose('Cobro registrado correctamente.', 'success')
    } else {
      setError(result?.error || 'Error al registrar pago')
      setLoading(false)
    }
  }

  return (
    <div className="lab-modal-overlay" onClick={dismiss}>
      <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">Registrar cobro</h3>
        {error && <div className="mb-3 p-3 text-sm text-red-400 border border-red-500/30 rounded-lg">{error}</div>}

        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Usuario</label>
            <select name="usuarioId" className="lab-input" required>
              <option value="">Seleccionar</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} — {u.correo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Laboratorio (opcional)</label>
            <select name="laboratorioId" className="lab-input">
              <option value="">General</option>
              {laboratorios.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Tipo de cobro</label>
              <select name="tipoCobro" className="lab-input" defaultValue="PAGO_HORA">
                {TIPOS_COBRO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Monto (Q)</label>
              <input type="number" name="monto" step="0.01" min="0" required className="lab-input" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Método de pago</label>
            <select name="metodoPago" className="lab-input" defaultValue="EFECTIVO">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA_POS">Tarjeta (POS)</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Notas</label>
            <input name="notas" className="lab-input" placeholder="Referencia, observaciones..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={dismiss} className="lab-btn-ghost">Cancelar</button>
            <button type="submit" className="lab-btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
