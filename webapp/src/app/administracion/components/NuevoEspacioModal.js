'use client'

import { useState, useTransition } from 'react'
import { crearEspacio } from '../actions'

const TIPOS = [
  { value: 'SALON', label: 'Salón' },
  { value: 'AUDITORIO', label: 'Auditorio' },
  { value: 'LABORATORIO_ADMIN', label: 'Laboratorio' },
  { value: 'SALA_REUNIONES', label: 'Sala de Reuniones' },
  { value: 'CANCHA', label: 'Cancha / Área Deportiva' },
  { value: 'OTRO', label: 'Otro' },
]

export default function NuevoEspacioModal({ onClose }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'SALON',
    capacidad: '30',
    ubicacion: '',
    piso: '',
    tieneProyector: false,
    tieneAireAcondicionado: false,
    tieneInternetWifi: false,
    tienePizarron: false,
    tienePizarronDigital: false,
    notasRecursos: '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggle = (k) => setForm((f) => ({ ...f, [k]: !f[k] }))

  const handleSubmit = () => {
    if (!form.codigo || !form.nombre || !form.ubicacion || !form.capacidad) {
      setError('Completa los campos requeridos: código, nombre, ubicación y capacidad.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await crearEspacio(form)
      if (result.success) {
        onClose('Espacio creado correctamente.', 'success')
      } else {
        setError(result.error)
      }
    })
  }

  return (
      <div className="adm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="adm-modal">
          <div className="adm-modal-header">
            <h2><i className="fa fa-plus-circle" aria-hidden="true" /> Nuevo Espacio</h2>
            <button type="button" className="adm-modal-close" onClick={() => onClose()} aria-label="Cerrar">
              <i className="fa fa-times" />
            </button>
          </div>

          <div className="adm-modal-body">
            {error && <div className="adm-alert adm-alert-error"><i className="fa fa-exclamation-circle" /> {error}</div>}

            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-label">Código *</label>
                <input className="adm-input" placeholder="Ej: SAL-A101" value={form.codigo}
                       onChange={(e) => set('codigo', e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Tipo *</label>
                <select className="adm-input" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Nombre *</label>
              <input className="adm-input" placeholder="Ej: Salón A-101" value={form.nombre}
                     onChange={(e) => set('nombre', e.target.value)} />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Descripción</label>
              <textarea className="adm-input adm-textarea" placeholder="Descripción del espacio (opcional)"
                        value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={2} />
            </div>

            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label className="adm-label">Ubicación *</label>
                <input className="adm-input" placeholder="Ej: Edificio A, Nivel 1" value={form.ubicacion}
                       onChange={(e) => set('ubicacion', e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Piso</label>
                <input className="adm-input" type="number" min="0" placeholder="Ej: 2" value={form.piso}
                       onChange={(e) => set('piso', e.target.value)} />
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Capacidad (personas) *</label>
              <input className="adm-input" type="number" min="1" value={form.capacidad}
                     onChange={(e) => set('capacidad', e.target.value)} />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Recursos disponibles</label>
              <div className="adm-checkbox-grid">
                {[
                  { key: 'tieneProyector', label: 'Proyector' },
                  { key: 'tieneAireAcondicionado', label: 'Aire Acondicionado' },
                  { key: 'tieneInternetWifi', label: 'Internet / WiFi' },
                  { key: 'tienePizarron', label: 'Pizarrón' },
                  { key: 'tienePizarronDigital', label: 'Pizarrón Digital' },
                ].map(({ key, label }) => (
                    <label key={key} className="adm-checkbox-item">
                      <input type="checkbox" checked={form[key]} onChange={() => toggle(key)} />
                      <span>{label}</span>
                    </label>
                ))}
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Notas sobre recursos</label>
              <input className="adm-input" placeholder="Ej: Proyector marca Epson, 3000 lúmenes" value={form.notasRecursos}
                     onChange={(e) => set('notasRecursos', e.target.value)} />
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-ghost" onClick={() => onClose()} disabled={pending}>
              Cancelar
            </button>
            <button type="button" className="adm-btn-primary" onClick={handleSubmit} disabled={pending}>
              {pending ? <><i className="fa fa-spinner fa-spin" /> Guardando…</> : <><i className="fa fa-save" /> Crear Espacio</>}
            </button>
          </div>
        </div>
      </div>
  )
}
