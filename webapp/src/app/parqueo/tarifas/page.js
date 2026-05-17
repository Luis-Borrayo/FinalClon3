"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const ROL_ES = {
  ADMIN:    "Administrador",
  TEACHER:  "Docente",
  STUDENT:  "Estudiante",
  VISITOR:  "Visitante",
  SECURITY: "Seguridad",
};

const ROL_ICON = {
  ADMIN:    "fa-star",
  TEACHER:  "fa-graduation-cap",
  STUDENT:  "fa-user",
  VISITOR:  "fa-id-card-o",
  SECURITY: "fa-shield",
};

const ROL_COLOR = {
  ADMIN:    "#800020",
  TEACHER:  "#1a6e3c",
  STUDENT:  "#1a3e6e",
  VISITOR:  "#7d4e1a",
  SECURITY: "#4a4a4a",
};

const DEMO_TARIFFS = [
  { id: "d1", role: "ADMIN",    hourly_rate: 0,  is_free: true,  max_free_hours: null },
  { id: "d2", role: "TEACHER",  hourly_rate: 0,  is_free: true,  max_free_hours: 8    },
  { id: "d3", role: "STUDENT",  hourly_rate: 5,  is_free: false, max_free_hours: null },
  { id: "d4", role: "VISITOR",  hourly_rate: 10, is_free: false, max_free_hours: null },
  { id: "d5", role: "SECURITY", hourly_rate: 0,  is_free: true,  max_free_hours: null },
];

export default function TarifasPage() {
  const [tariffs,  setTariffs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);

  useEffect(() => {
    api.get("/tariffs")
      .then(r => setTariffs(r.data.data?.length ? r.data.data : DEMO_TARIFFS))
      .catch(() => setTariffs(DEMO_TARIFFS))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(t) {
    setEditing({ ...t, hourly_rate: parseFloat(t.hourly_rate ?? 0) });
    setMsg(null);
  }

  function cancelEdit() {
    setEditing(null);
    setMsg(null);
  }

  async function saveEdit() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await api.patch("/tariffs", {
        role:           editing.role,
        hourly_rate:    editing.is_free ? 0 : editing.hourly_rate,
        is_free:        editing.is_free,
        max_free_hours: editing.role === "TEACHER" ? (editing.max_free_hours || null) : null,
      });
      const updated = r.data.data;
      setTariffs(prev => prev.map(t => t.role === updated.role ? updated : t));
      setEditing(null);
      setMsg({ type: "success", text: `Tarifa de ${ROL_ES[updated.role]} actualizada correctamente` });
    } catch (e) {
      setMsg({ type: "danger", text: e.response?.data?.message ?? "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="row clearfix">
      <div className="col-12">


        {/* Encabezado */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="header" style={{ background: "#800020", color: "#fff", padding: "14px 20px", borderRadius: "4px 4px 0 0" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              <i className="fa fa-usd" style={{ marginRight: 8 }} />
              Configuración de Tarifas
            </h2>
            <small style={{ opacity: 0.85, fontSize: 12 }}>
              Las tarifas se aplican automáticamente al registrar la salida de cada vehículo
            </small>
          </div>

          <div className="body">
            {msg && (
              <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
                <i className={`fa ${msg.type === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}`} style={{ marginRight: 6 }} />
                {msg.text}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
                <i className="fa fa-spinner fa-spin fa-2x" />
                <p style={{ marginTop: 8 }}>Cargando tarifas...</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-hover" style={{ marginBottom: 0 }}>
                  <thead style={{ background: "#f5f5f5" }}>
                    <tr>
                      <th>Rol</th>
                      <th>Tarifa / hora</th>
                      <th>Horas gratis máx.</th>
                      <th>Estado</th>
                      <th style={{ width: 120 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map(t => (
                      <tr key={t.role}>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <i className={`fa ${ROL_ICON[t.role]}`} style={{ color: ROL_COLOR[t.role], fontSize: 16 }} />
                            <strong>{ROL_ES[t.role]}</strong>
                          </span>
                        </td>
                        <td>
                          {t.is_free
                            ? <span style={{ color: "#1a6e3c", fontWeight: 600 }}>Gratis</span>
                            : <span style={{ fontWeight: 600 }}>Q {parseFloat(t.hourly_rate).toFixed(2)}</span>
                          }
                        </td>
                        <td>
                          {t.max_free_hours
                            ? <span><strong>{t.max_free_hours}</strong> horas</span>
                            : <span style={{ color: "#bbb" }}>—</span>
                          }
                        </td>
                        <td>
                          <span className={`badge bg-${t.is_free ? "success" : "primary"}`}
                            style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11,
                              background: t.is_free ? "#1a6e3c" : "#1a3e6e", color: "#fff" }}>
                            {t.is_free ? "Exento" : "Con cobro"}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-xs btn-default" onClick={() => startEdit(t)}
                            style={{ border: "1px solid #ccc" }}>
                            <i className="fa fa-pencil" style={{ marginRight: 4 }} />
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal de edición */}
        {editing && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              background: "#1e252b", borderRadius: 8, width: "100%", maxWidth: 440,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)", overflow: "hidden",
              color: "#e0e0e0",
            }}>
              {/* Header modal */}
              <div style={{ background: "#800020", color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  <i className={`fa ${ROL_ICON[editing.role]}`} style={{ marginRight: 8 }} />
                  Editar tarifa — {ROL_ES[editing.role]}
                </span>
                <button onClick={cancelEdit} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>
                  <i className="fa fa-times" />
                </button>
              </div>

              <div style={{ padding: 24 }}>
                {/* Checkbox gratis */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 600, color: "#e0e0e0" }}>
                    <input
                      type="checkbox"
                      checked={editing.is_free}
                      onChange={e => setEditing(prev => ({ ...prev, is_free: e.target.checked }))}
                      style={{ width: 16, height: 16 }}
                    />
                    Acceso gratuito (no cobrar)
                  </label>
                  <small style={{ color: "#9e9e9e", marginLeft: 26 }}>
                    Si está marcado, este rol no paga tarifa
                  </small>
                </div>

                {/* Tarifa por hora */}
                {!editing.is_free && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#e0e0e0" }}>
                      Tarifa por hora (Q)
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#e0e0e0" }}>Q</span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={editing.hourly_rate}
                        onChange={e => setEditing(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                        className="form-control"
                        style={{ maxWidth: 120, background: "#2a333d", color: "#e0e0e0", border: "1px solid #444" }}
                      />
                      <span style={{ color: "#9e9e9e", fontSize: 13 }}>por hora</span>
                    </div>
                  </div>
                )}

                {/* Horas gratis máximas (solo TEACHER) */}
                {editing.role === "TEACHER" && editing.is_free && (
                  <div style={{ marginBottom: 18, background: "rgba(26,110,60,0.15)", padding: 14, borderRadius: 6, border: "1px solid rgba(26,110,60,0.4)" }}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#4caf50" }}>
                      <i className="fa fa-clock-o" style={{ marginRight: 6 }} />
                      Límite de horas gratuitas
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={editing.max_free_hours ?? ""}
                        onChange={e => setEditing(prev => ({ ...prev, max_free_hours: parseInt(e.target.value) || null }))}
                        className="form-control"
                        placeholder="Sin límite"
                        style={{ maxWidth: 100, background: "#2a333d", color: "#e0e0e0", border: "1px solid #444" }}
                      />
                      <span style={{ color: "#9e9e9e", fontSize: 13 }}>horas gratis por sesión</span>
                    </div>
                    <small style={{ color: "#9e9e9e", marginTop: 4, display: "block" }}>
                      Pasado este límite se cobra la tarifa de Estudiante por el tiempo excedido.
                      Dejar vacío para sin límite.
                    </small>
                  </div>
                )}

                {/* Previsualización */}
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: 12, marginBottom: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <strong style={{ fontSize: 12, color: "#9e9e9e", display: "block", marginBottom: 6 }}>EJEMPLO DE COBRO</strong>
                  {editing.is_free && !editing.max_free_hours && (
                    <span style={{ color: "#4caf50" }}>2 horas → <strong>Q 0.00</strong> (gratis)</span>
                  )}
                  {editing.is_free && editing.max_free_hours && (
                    <>
                      <div style={{ color: "#4caf50" }}>
                        {editing.max_free_hours} horas → <strong>Q 0.00</strong> (dentro del límite)
                      </div>
                      <div style={{ color: "#ef9a9a", marginTop: 4 }}>
                        {editing.max_free_hours + 2} horas → <strong>Q {(2 * 5).toFixed(2)}</strong> (2h excedente × Q5.00 tarifa estudiante)
                      </div>
                    </>
                  )}
                  {!editing.is_free && (
                    <span style={{ color: "#e0e0e0" }}>2 horas → <strong>Q {(2 * (editing.hourly_rate || 0)).toFixed(2)}</strong></span>
                  )}
                </div>

                {/* Botones */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-default" onClick={cancelEdit} disabled={saving}
                    style={{ background: "#2a333d", color: "#e0e0e0", border: "1px solid #555" }}>
                    Cancelar
                  </button>
                  <button className="btn btn-success" onClick={saveEdit} disabled={saving}
                    style={{ background: "#800020", borderColor: "#800020" }}>
                    {saving
                      ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Guardando...</>
                      : <><i className="fa fa-save" style={{ marginRight: 6 }} />Guardar tarifa</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nota informativa */}
        <div className="alert alert-info" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <i className="fa fa-info-circle" style={{ fontSize: 20, marginTop: 2, color: "#31708f" }} />
          <div>
            <strong>Cómo funcionan las tarifas:</strong>
            <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Si el usuario tiene <strong>suscripción activa</strong> → entrada gratis sin importar el rol</li>
              <li>Si hay un <strong>evento con tarifa fija</strong> activo → se cobra la tarifa del evento</li>
              <li>En caso normal → se aplica la tarifa de esta tabla según el rol del propietario del vehículo</li>
              <li>Docentes con límite de horas: el excedente cobra la tarifa de Estudiante</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
