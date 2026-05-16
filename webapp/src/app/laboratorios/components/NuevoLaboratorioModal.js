'use client'

import { useState } from 'react'
import { crearLaboratorio } from '../actions'

const TIPOS = [
  { value: 'COMPUTACION', label: 'Computación' },
  { value: 'PLC_CNC', label: 'PLC / CNC' },
  { value: 'QUIMICA', label: 'Química' },
  { value: 'FISICA', label: 'Física' },
]

export default function NuevoLaboratorioModal({ onClose = () => {} }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dismiss = () => onClose()

  async function handleSubmit(formData) {
    setLoading(true)
    setError('')
    const result = await crearLaboratorio(formData)
    if (result?.success) {
      onClose('Laboratorio creado correctamente.', 'success')
    } else {
      setError(result?.error || 'Error inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="lab-modal-overlay" onClick={dismiss}>
      <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold m-0 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center">
              <i className="fa fa-plus text-sm" />
            </span>
            Nuevo laboratorio
          </h3>
          <button type="button" onClick={dismiss} className="lab-btn-ghost py-1 px-2">
            <i className="fa fa-times" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm border border-red-500/40 bg-red-500/10 text-red-400">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Código</label>
              <input name="codigo" required placeholder="LAB-COMP" className="lab-input" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Tipo</label>
              <select name="tipo" className="lab-input" defaultValue="COMPUTACION">
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Nombre</label>
            <input name="nombre" required placeholder="Laboratorio de Computación" className="lab-input" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Ubicación</label>
            <input name="ubicacion" placeholder="Edificio Ingeniería — Planta 2" className="lab-input" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Descripción</label>
            <textarea name="descripcion" rows={3} className="lab-input" placeholder="Propósito del laboratorio..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Capacidad</label>
              <input type="number" name="capacidadTotal" defaultValue={30} min={1} required className="lab-input" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide opacity-70 mb-1">Fase</label>
              <input type="number" name="faseImplementacion" defaultValue={1} min={1} max={4} className="lab-input" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" name="permiteDivision" defaultChecked className="rounded" />
            Permite divisiones parciales
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={dismiss} className="lab-btn-ghost" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="lab-btn-primary" disabled={loading}>
              {loading ? <><i className="fa fa-spinner fa-spin" /> Guardando...</> : <><i className="fa fa-save" /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
