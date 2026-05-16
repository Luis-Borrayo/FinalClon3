'use client'

import { useState } from 'react'
import { crearReserva } from '../actions'

export default function NuevaReservaModal({ laboratorios, usuarios, onClose = () => {}, laboratorioIdDefault }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dismiss = () => onClose()
  const [labId, setLabId] = useState(laboratorioIdDefault || laboratorios[0]?.id || '')

  const lab = laboratorios.find((l) => l.id === Number(labId))
  const configs = lab?.configuraciones || []

  async function handleSubmit(formData) {
    setLoading(true)
    setError('')
    const result = await crearReserva(formData)
    if (result?.success) {
      onClose('Reservación enviada. Pendiente de aprobación del técnico.', 'success')
    } else {
      setError(result?.error || 'Error al crear reservación')
      setLoading(false)
    }
  }

  return (
    <div className="lab-modal-overlay" onClick={dismiss}>
      <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">Nueva reservación</h3>
        {error && <div className="mb-3 p-3 text-sm text-red-400 border border-red-500/30 rounded-lg">{error}</div>}

        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Laboratorio</label>
            <select
              name="laboratorioId"
              className="lab-input"
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
              required
            >
              {laboratorios.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Solicitante</label>
            <select name="usuarioId" className="lab-input" required>
              <option value="">Seleccionar usuario</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido || ''} — {u.correo}
                </option>
              ))}
            </select>
          </div>

          {configs.length > 0 && (
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Configuración</label>
              <select name="configuracionDivisionId" className="lab-input">
                <option value="">Sin configuración específica</option>
                {configs.map((c) => (
                  <option key={c.id} value={c.id}>{c.etiqueta} ({c.cupo} plazas)</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Inicio</label>
              <input type="datetime-local" name="fechaInicio" required className="lab-input" />
            </div>
            <div>
              <label className="block text-xs uppercase opacity-70 mb-1">Fin</label>
              <input type="datetime-local" name="fechaFin" required className="lab-input" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Personas</label>
            <input type="number" name="cantidadPersonas" min={1} defaultValue={1} className="lab-input" />
          </div>

          <div>
            <label className="block text-xs uppercase opacity-70 mb-1">Propósito</label>
            <textarea name="proposito" required rows={2} className="lab-input" placeholder="Clase, práctica, evento..." />
          </div>

          <p className="text-xs opacity-60">
            <i className="fa fa-info-circle" /> Toda reservación requiere aprobación del técnico encargado.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={dismiss} className="lab-btn-ghost">Cancelar</button>
            <button type="submit" className="lab-btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
