'use client'

import { useState, useTransition } from 'react'
import { crearReservaEspacio } from '../actions'

export default function NuevaReservaEspacioModal({ espacios, usuarios, onClose }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  const hoy = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fechaHoy = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`

  const [form, setForm] = useState({
    espacioId: '',
    solicitanteId: usuarios[0]?.id ? String(usuarios[0].id) : '',
    titulo: '',
    proposito: '',
    fechaInicio: `${fechaHoy}T08:00`,
    fechaFin: `${fechaHoy}T10:00`,
    cantidadPersonas: '1',
    recurrente: false,
    diasRecurrencia: [],
    notas: '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleDia = (dia) => {
    setForm((f) => ({
      ...f,
      diasRecurrencia: f.diasRecurrencia.includes(dia)
          ? f.diasRecurrencia.filter((d) => d !== dia)
          : [...f.diasRecurrencia, dia],
    }))
  }

  const espacioSeleccionado = espacios.find((e) => e.id === parseInt(form.espacioId))

  const handleSubmit = () => {
    if (!form.espacioId || !form.solicitanteId || !form.titulo || !form.proposito || !form.fechaInicio || !form.fechaFin) {
      setError('Completa todos los campos requeridos.')
      return
    }
    if (new Date(form.fechaFin) <= new Date(form.fechaInicio)) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }
    setError(null)
    startTransition(async () => {
      const payload = {
        ...form,
        solicitanteId: parseInt(form.solicitanteId),
        diasRecurrencia: form.diasRecurrencia.join(',') || null,
      }
      const result = await crearReservaEspacio(payload)
      if (result.success) {
        onClose('Reserva creada correctamente. Pendiente de aprobación.', 'success')
      } else {
        setError(result.error)
      }
    })
  }

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (
      <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="adm-modal adm-modal--wide">
          <div className="adm-modal-header">
            <h2><i className="fa fa-calendar-plus-o" /> Nueva Reserva</h2>
            <button type="button" className="adm-modal-close" onClick={() => onClose()} aria-label="Cerrar">
              <i className="fa fa-times" />
            </button>
          </div>

          <div className="adm-modal-body">
            {error && <div className="adm-alert adm-alert-error"><i className="fa fa-exclamation-circle" /> {error}</div>}

            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-label">Espacio *</label>
                <select className="adm-input" value={form.espacioId} onChange={(e) => set('espacioId', e.target.value)}>
                  <option value="">— Seleccionar espacio —</option>
                  {espacios.filter(e => e.estado !== 'FUERA_DE_SERVICIO').map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre} ({e.codigo}) — Cap. {e.capacidad}</option>
                  ))}
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Catedrático Solicitante *</label>
                <select className="adm-input" value={form.solicitanteId} onChange={(e) => set('solicitanteId', e.target.value)}>
                  <option value="">— Seleccionar catedrático —</option>
                  {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} {u.apellido || ''} ({u.codigo})</option>
                  ))}
                </select>
              </div>
            </div>

            {espacioSeleccionado && (
                <div className="adm-espacio-info">
                  <i className="fa fa-info-circle" />
                  <span>
                <strong>{espacioSeleccionado.nombre}</strong> · Capacidad: {espacioSeleccionado.capacidad} personas ·{' '}
                    {espacioSeleccionado.ubicacion}
                    {espacioSeleccionado.tieneProyector && ' · Proyector ✓'}
                    {espacioSeleccionado.tieneAireAcondicionado && ' · A/C ✓'}
              </span>
                </div>
            )}

            <div className="adm-form-group">
              <label className="adm-label">Título del evento / clase *</label>
              <input className="adm-input" placeholder="Ej: Cátedra de Cálculo I — Grupo A"
                     value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Propósito / descripción *</label>
              <textarea className="adm-input adm-textarea" rows={2}
                        placeholder="Describe para qué se usará el espacio"
                        value={form.proposito} onChange={(e) => set('proposito', e.target.value)} />
            </div>

            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-label">Fecha y hora de inicio *</label>
                <input className="adm-input" type="datetime-local"
                       value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Fecha y hora de fin *</label>
                <input className="adm-input" type="datetime-local"
                       value={form.fechaFin} onChange={(e) => set('fechaFin', e.target.value)} />
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Cantidad de personas</label>
              <input className="adm-input" type="number" min="1"
                     value={form.cantidadPersonas} onChange={(e) => set('cantidadPersonas', e.target.value)} />
            </div>

            <div className="adm-form-group">
              <label className="adm-checkbox-item">
                <input type="checkbox" checked={form.recurrente} onChange={() => set('recurrente', !form.recurrente)} />
                <span>Reserva recurrente (se repite en varios días)</span>
              </label>
            </div>

            {form.recurrente && (
                <div className="adm-form-group">
                  <label className="adm-label">Días de repetición</label>
                  <div className="adm-checkbox-grid">
                    {DIAS.map((dia) => (
                        <label key={dia} className="adm-checkbox-item">
                          <input type="checkbox"
                                 checked={form.diasRecurrencia.includes(dia)}
                                 onChange={() => toggleDia(dia)} />
                          <span>{dia}</span>
                        </label>
                    ))}
                  </div>
                </div>
            )}

            <div className="adm-form-group">
              <label className="adm-label">Notas adicionales</label>
              <input className="adm-input" placeholder="Observaciones opcionales"
                     value={form.notas} onChange={(e) => set('notas', e.target.value)} />
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-ghost" onClick={() => onClose()} disabled={pending}>
              Cancelar
            </button>
            <button type="button" className="adm-btn-primary" onClick={handleSubmit} disabled={pending}>
              {pending
                  ? <><i className="fa fa-spinner fa-spin" /> Enviando…</>
                  : <><i className="fa fa-calendar-check-o" /> Solicitar Reserva</>}
            </button>
          </div>
        </div>
      </div>
  )
}