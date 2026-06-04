'use client'

import { useState, useTransition } from 'react'
import { crearReporteMantenimiento } from '../actions'

const TIPOS_ELEMENTO = [
  { value: 'AIRE_ACONDICIONADO', label: 'Aire Acondicionado', icon: 'fa-snowflake-o' },
  { value: 'PROYECTOR', label: 'Proyector', icon: 'fa-video-camera' },
  { value: 'ILUMINACION', label: 'Iluminación', icon: 'fa-lightbulb-o' },
  { value: 'MOBILIARIO', label: 'Mobiliario', icon: 'fa-chair' },
  { value: 'PUERTA_VENTANA', label: 'Puerta / Ventana', icon: 'fa-window-maximize' },
  { value: 'SANITARIO', label: 'Sanitario', icon: 'fa-tint' },
  { value: 'OTRO', label: 'Otro', icon: 'fa-wrench' },
]

const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja', desc: 'No afecta el uso normal' },
  { value: 'MEDIA', label: 'Media', desc: 'Afecta parcialmente' },
  { value: 'ALTA', label: 'Alta', desc: 'Impide uso óptimo' },
  { value: 'URGENTE', label: 'Urgente', desc: 'Requiere atención inmediata' },
]

export default function NuevoReporteModal({ espacios, usuarios, onClose }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    espacioId: '',
    reportadoPorId: '',
    titulo: '',
    descripcion: '',
    tipoElemento: 'OTRO',
    prioridad: 'MEDIA',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.reportadoPorId || !form.titulo || !form.descripcion) {
      setError('Completa los campos requeridos: reportado por, título y descripción.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await crearReporteMantenimiento({
        ...form,
        reportadoPorId: parseInt(form.reportadoPorId),
      })
      if (result.success) {
        onClose('Reporte enviado correctamente.', 'success')
      } else {
        setError(result.error)
      }
    })
  }

  return (
      <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="adm-modal">
          <div className="adm-modal-header">
            <h2><i className="fa fa-wrench" /> Reportar Problema de Mantenimiento</h2>
            <button type="button" className="adm-modal-close" onClick={() => onClose()} aria-label="Cerrar">
              <i className="fa fa-times" />
            </button>
          </div>

          <div className="adm-modal-body">
            {error && <div className="adm-alert adm-alert-error"><i className="fa fa-exclamation-circle" /> {error}</div>}

            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-label">Espacio (opcional)</label>
                <select className="adm-input" value={form.espacioId} onChange={(e) => set('espacioId', e.target.value)}>
                  <option value="">— Sin espacio específico —</option>
                  {espacios.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre} ({e.codigo})</option>
                  ))}
                </select>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Reportado por *</label>
                <select className="adm-input" value={form.reportadoPorId} onChange={(e) => set('reportadoPorId', e.target.value)}>
                  <option value="">— Seleccionar catedrático —</option>
                  {usuarios.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.nombre} {u.apellido || ''} — {u.codigo}
                      </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Tipo de elemento afectado</label>
              <div className="adm-tipo-grid">
                {TIPOS_ELEMENTO.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        className={`adm-tipo-btn ${form.tipoElemento === t.value ? 'active' : ''}`}
                        onClick={() => set('tipoElemento', t.value)}
                    >
                      <i className={`fa ${t.icon}`} />
                      <span>{t.label}</span>
                    </button>
                ))}
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Título del problema *</label>
              <input className="adm-input" placeholder="Ej: Aire acondicionado no enfría"
                     value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Descripción detallada *</label>
              <textarea className="adm-input adm-textarea" rows={3}
                        placeholder="Describe el problema con el mayor detalle posible"
                        value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Prioridad</label>
              <div className="adm-prioridad-grid">
                {PRIORIDADES.map((p) => (
                    <button
                        key={p.value}
                        type="button"
                        className={`adm-prioridad-btn adm-prioridad-btn--${p.value.toLowerCase()} ${form.prioridad === p.value ? 'active' : ''}`}
                        onClick={() => set('prioridad', p.value)}
                    >
                      <strong>{p.label}</strong>
                      <span>{p.desc}</span>
                    </button>
                ))}
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-ghost" onClick={() => onClose()} disabled={pending}>
              Cancelar
            </button>
            <button type="button" className="adm-btn-primary" onClick={handleSubmit} disabled={pending}>
              {pending
                  ? <><i className="fa fa-spinner fa-spin" /> Enviando…</>
                  : <><i className="fa fa-paper-plane" /> Enviar Reporte</>}
            </button>
          </div>
        </div>
      </div>
  )
}