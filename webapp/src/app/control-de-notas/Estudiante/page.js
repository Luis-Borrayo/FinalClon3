"use client";

import { useEffect, useRef, useState } from "react";

// ── APIs que consumimos ───────────────────────────────────────────────────────
// GET /api/control-de-notas/notas/:carnet
// GET /api/control-de-notas/notas/:carnet/solvencia-estado
// GET /api/control-de-notas/asistencias/:carnet/:curso
// ─────────────────────────────────────────────────────────────────────────────

// ── Toast flotante ────────────────────────────────────────────────────────────
function SolvenciaToast({ icono, titulo, badge, solvente, children, visible, onClose }) {
  const [show,     setShow]     = useState(false);
  const [barWidth, setBarWidth] = useState(100);
  const timerRef                = useRef(null);
  const duration                = 5000;

  useEffect(() => {
    if (visible) {
      setBarWidth(100);
      requestAnimationFrame(() => {
        setShow(true);
        requestAnimationFrame(() => setBarWidth(0));
      });
      timerRef.current = setTimeout(() => onClose(), duration);
    } else {
      setShow(false);
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible]);

  return (
    <div style={{
      width: "340px", background: "white", borderRadius: "12px",
      border: "0.5px solid #e0e0e0",
      borderTop: `3px solid ${solvente ? "#2e7d32" : "#c62828"}`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.14)", overflow: "hidden",
      transform: show ? "translateX(0) scale(1)" : "translateX(400px) scale(0.96)",
      opacity: show ? 1 : 0,
      transition: "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
      pointerEvents: show ? "all" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>{icono}</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>{titulo}</span>
          <span style={{
            padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
            backgroundColor: solvente ? "#e8f5e9" : "#ffebee",
            color: solvente ? "#2e7d32" : "#c62828",
          }}>{badge}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#aaa" }}>✕</button>
      </div>
      <div style={{ height: "3px", background: "#f0f0f0" }}>
        <div style={{
          height: "100%", background: solvente ? "#2e7d32" : "#c62828",
          width: `${barWidth}%`,
          transition: barWidth === 0 ? `width ${duration}ms linear` : "none",
        }} />
      </div>
      <div style={{ padding: "10px 14px 14px" }}>{children}</div>
    </div>
  );
}

// ── Badge de estado de nota ───────────────────────────────────────────────────
function BadgeNota({ nota }) {
  const color = nota >= 61 ? "#2e7d32" : "#c62828";
  const bg    = nota >= 61 ? "#e8f5e9" : "#ffebee";
  return (
    <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: bg, color }}>
      {nota}
    </span>
  );
}

// ── Barra de progreso ─────────────────────────────────────────────────────────
function BarraProgreso({ valor, max, color }) {
  const pct = Math.min(100, (valor / max) * 100);
  return (
    <div style={{ background: "#f0f0f0", borderRadius: "999px", height: "8px", width: "100%" }}>
      <div style={{ width: `${pct}%`, background: color, borderRadius: "999px", height: "100%", transition: "width 0.6s ease" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EstudiantePage() {
  const [usuario,       setUsuario]       = useState(null);
  const [notas,         setNotas]         = useState(null);
  const [solvencia,     setSolvencia]     = useState(null);
  const [cargando,      setCargando]      = useState(true);
  const [error,         setError]         = useState("");
  const [tabActiva,     setTabActiva]     = useState("notas");
  const [toastVisible,  setToastVisible]  = useState({ solvencia: false });

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { window.location.href = "/login"; return; }
    const u = JSON.parse(raw);
    if (u.role !== "STUDENT") { window.location.href = "/login"; return; }
    setUsuario(u);
    cargarDatos(u.id);
  }, []);

  const cargarDatos = async (carnet) => {
    setCargando(true);
    setError("");
    try {
      const [resNotas, resSolvencia] = await Promise.all([
        fetch(`/api/control-de-notas/notas/${carnet}`),
        fetch(`/api/control-de-notas/notas/${carnet}/solvencia-estado`),
      ]);

      const [dNotas, dSolvencia] = await Promise.all([
        resNotas.json(),
        resSolvencia.json(),
      ]);

      if (!dNotas.success)     throw new Error(dNotas.message);
      if (!dSolvencia.success) throw new Error(dSolvencia.message);

      setNotas(dSolvencia);
      setSolvencia(dSolvencia);

      // guardar notas separado
      setNotas(dNotas);
      setSolvencia(dSolvencia);

    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) return (
    <div style={{ textAlign: "center", padding: "80px" }}>
      <p style={{ fontSize: "18px", color: "#666" }}>⏳ Cargando tu información...</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "60px" }}>
      <p style={{ color: "#c62828", fontSize: "16px" }}>⚠️ {error}</p>
      <a href="/control-de-notas" style={{ color: "#800020" }}>← Volver al login</a>
    </div>
  );

  const notasLista   = notas?.notas         ?? [];
  const resumen      = notas?.resumen        ?? {};
  const solvGeneral  = solvencia?.solvenciaGeneral ?? false;
  const reprobados   = solvencia?.solvenciaNotas?.cursosReprobados ?? [];

  const aprobados  = notasLista.filter((n) => n.estado === "aprobado");
  const reproList  = notasLista.filter((n) => n.estado === "reprobado");

  return (
    <div className="row clearfix">
      <div className="col-lg-12">
        <div className="card" style={{ background: "#fff" }}>

          {/* ── Header ── */}
          <div className="card-header" style={{
            background: "#fff", display: "flex", justifyContent: "space-between",
            alignItems: "center", borderBottom: "2px solid #800020",
          }}>
            <div>
              <h3 style={{ color: "#800020", marginBottom: "4px" }}>
                👨‍🎓 {notas?.alumno?.nombre ?? usuario?.nombre}
              </h3>
              <p style={{ color: "#666", margin: 0 }}>
                Carnet: {usuario?.id} | Carrera: {notas?.alumno?.carrera ?? "—"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setToastVisible((p) => ({ ...p, solvencia: !p.solvencia }))}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 16px", borderRadius: "10px", cursor: "pointer",
                  border: `1.5px solid ${solvGeneral ? "#2e7d32" : "#c62828"}`,
                  background: solvGeneral ? "#e8f5e9" : "#ffebee",
                  color: solvGeneral ? "#2e7d32" : "#c62828",
                  fontWeight: 600, fontSize: "13px",
                }}
              >
                {solvGeneral ? "✅" : "⚠️"} Solvencia
              </button>
              <a href="/control-de-notas" style={{ color: "#888", fontSize: "13px" }}>🚪 Salir</a>
            </div>
          </div>

          <div className="card-body">

            {/* ── Stats rápidos ── */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
              {[
                { label: "Promedio General",   valor: resumen.promedioGeneral   ?? "—", color: "#1976d2", bg: "#e3f2fd", suffix: "" },
                { label: "Cursos Aprobados",   valor: resumen.cursosAprobados   ?? 0,   color: "#2e7d32", bg: "#e8f5e9", suffix: "" },
                { label: "Cursos Reprobados",  valor: resumen.cursosReprobados  ?? 0,   color: "#c62828", bg: "#ffebee", suffix: "" },
                { label: "Créditos Obtenidos", valor: resumen.creditosAprobados ?? 0,   color: "#e65100", bg: "#fff3e0", suffix: "" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "14px 20px", borderRadius: "10px", background: s.bg,
                  border: `1.5px solid ${s.color}22`, minWidth: "130px", textAlign: "center",
                }}>
                  <p style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: s.color }}>
                    {s.valor}{s.suffix}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #f0f0f0" }}>
              {[
                { id: "notas",      label: "📝 Mis Notas" },
                { id: "reprobados", label: `❌ Reprobados (${reproList.length})` },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setTabActiva(tab.id)} style={{
                  padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                  borderBottom: tabActiva === tab.id ? "3px solid #800020" : "3px solid transparent",
                  color: tabActiva === tab.id ? "#800020" : "#666",
                  fontWeight: tabActiva === tab.id ? 700 : 400,
                  fontSize: "14px", marginBottom: "-2px",
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Todas las notas ── */}
            {tabActiva === "notas" && (
              <div>
                {notasLista.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#aaa", padding: "40px" }}>
                    No hay notas registradas.
                  </p>
                ) : (
                  <table className="table" style={{ width: "100%" }}>
                    <thead>
                      <tr style={{ background: "#f9f9f9" }}>
                        <th>Código</th>
                        <th>Curso</th>
                        <th>Período</th>
                        <th className="text-center">Zona</th>
                        <th className="text-center">Final</th>
                        <th className="text-center">Nota Final</th>
                        <th className="text-center">Estado</th>
                        <th className="text-center">Créditos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notasLista.map((n, i) => (
                        <tr key={i} style={{ background: n.estado === "reprobado" ? "#fff8f8" : "white" }}>
                          <td style={{ fontWeight: 600, fontSize: "13px" }}>{n.curso}</td>
                          <td>{n.nombreCurso}</td>
                          <td style={{ fontSize: "13px", color: "#888" }}>{n.periodo}</td>
                          <td className="text-center">{n.zona}</td>
                          <td className="text-center">{n.examenFinal}</td>
                          <td className="text-center"><BadgeNota nota={n.notaFinal} /></td>
                          <td className="text-center">
                            <span style={{
                              padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                              background: n.estado === "aprobado" ? "#e8f5e9" : "#ffebee",
                              color: n.estado === "aprobado" ? "#2e7d32" : "#c62828",
                            }}>
                              {n.estado === "aprobado" ? "✅ Aprobado" : "❌ Reprobado"}
                            </span>
                          </td>
                          <td className="text-center">{n.creditos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Barra de progreso de créditos */}
                <div style={{ marginTop: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>📊 Progreso de créditos</span>
                    <span style={{ fontSize: "13px", color: "#666" }}>
                      {resumen.creditosAprobados ?? 0} / 200
                    </span>
                  </div>
                  <BarraProgreso valor={resumen.creditosAprobados ?? 0} max={200} color="#800020" />
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#888" }}>
                    Te faltan {200 - (resumen.creditosAprobados ?? 0)} créditos para completar la carrera
                  </p>
                </div>
              </div>
            )}

            {/* ── Tab: Reprobados ── */}
            {tabActiva === "reprobados" && (
              <div>
                {reproList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ fontSize: "40px" }}>🎉</p>
                    <p style={{ color: "#2e7d32", fontWeight: 600 }}>¡No tenés cursos reprobados!</p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
                      background: "#ffebee", border: "1px solid #ef9a9a", fontSize: "13px", color: "#c62828",
                    }}>
                      ⚠️ Tenés <strong>{reproList.length}</strong> curso(s) reprobado(s). Debés repetirlos para completar tu pensum.
                    </div>
                    <table className="table" style={{ width: "100%" }}>
                      <thead>
                        <tr style={{ background: "#f9f9f9" }}>
                          <th>Código</th>
                          <th>Curso</th>
                          <th>Período</th>
                          <th className="text-center">Zona</th>
                          <th className="text-center">Examen Final</th>
                          <th className="text-center">Nota Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reproList.map((n, i) => (
                          <tr key={i} style={{ background: "#fff8f8" }}>
                            <td style={{ fontWeight: 600 }}>{n.curso}</td>
                            <td>{n.nombreCurso}</td>
                            <td style={{ fontSize: "13px", color: "#888" }}>{n.periodo}</td>
                            <td className="text-center" style={{ color: "#c62828" }}>{n.zona}</td>
                            <td className="text-center" style={{ color: "#c62828" }}>{n.examenFinal}</td>
                            <td className="text-center"><BadgeNota nota={n.notaFinal} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Toast solvencia ── */}
      <div style={{
        position: "fixed", top: "16px", right: "16px",
        display: "flex", flexDirection: "column", gap: "10px",
        zIndex: 9999, pointerEvents: "none",
      }}>
        <SolvenciaToast
          icono={solvGeneral ? "✅" : "⚠️"}
          titulo="Estado de Solvencia"
          badge={solvGeneral ? "Solvente" : "Con pendientes"}
          solvente={solvGeneral}
          visible={toastVisible.solvencia}
          onClose={() => setToastVisible((p) => ({ ...p, solvencia: false }))}
        >
          <div style={{ fontSize: "13px" }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#444" }}>Notas:</p>
            <p style={{ margin: "0 0 4px", color: solvencia?.solvenciaNotas?.solvente ? "#2e7d32" : "#c62828" }}>
              {solvencia?.solvenciaNotas?.solvente
                ? "✅ Sin cursos reprobados"
                : `❌ ${solvencia?.solvenciaNotas?.totalReprobados} curso(s) reprobado(s)`}
            </p>
            <p style={{ margin: "8px 0 6px", fontWeight: 600, color: "#444" }}>Pagos:</p>
            <p style={{ margin: 0, color: solvencia?.solvenciaPagos?.solvente ? "#2e7d32" : "#c62828" }}>
              {solvencia?.solvenciaPagos?.solvente
                ? "✅ Sin mora pendiente"
                : `❌ Q${solvencia?.solvenciaPagos?.montoPendiente?.toFixed(2)} pendiente`}
            </p>
          </div>
        </SolvenciaToast>
      </div>
    </div>
  );
}