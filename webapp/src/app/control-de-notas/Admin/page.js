"use client";

import { useEffect, useState } from "react";

// ── Modal Confirm ───────────────────────────────────────────────────────────
function ModalConfirm({ titulo, mensaje, onConfirmar, onCancelar }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "white", borderRadius: "12px", padding: "28px",
        maxWidth: "380px", width: "90%", boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
      }}>
        <h5 style={{ marginBottom: "10px" }}>{titulo}</h5>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "20px" }}>{mensaje}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onCancelar} style={{ border: "1.5px solid #ccc", background: "white", color: "#444" }}>Cancelar</button>
          <button onClick={onConfirmar} style={{ background: "#c62828", color: "white", fontWeight: 700 }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Detalle Alumno ─────────────────────────────────────────────────────
function ModalDetalleAlumno({ carnet, nombre, onCerrar }) {
  const [notas, setNotas] = useState(null);
  const [solvencia, setSolvencia] = useState(null);
  const [graduacion, setGraduacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState("notas");

  useEffect(() => {
    const cargar = async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch(`/api/control-de-notas/notas/${carnet}`),
          fetch(`/api/solvencia/${carnet}`),
          fetch(`/api/control-de-notas/graduacion/requisitos/${carnet}`),
        ]);
        const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        if (d1.success) setNotas(d1);
        setSolvencia(d2);
        if (d3.success) setGraduacion(d3);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [carnet]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "760px", maxHeight: "88vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "2px solid #1976d2", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div>
            <h5 style={{ margin: 0, color: "#0d47a1" }}>🔍 Detalle: {nombre}</h5>
            <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Carnet: {carnet}</p>
          </div>
          <button onClick={onCerrar} style={{ background: "#f5f5f5", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {cargando ? (
            <p style={{ textAlign: "center" }}>Cargando información...</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                {[
                  { label: "Promedio", valor: notas?.resumen?.promedioGeneral ?? "—", color: "#1976d2", bg: "#e3f2fd" },
                  { label: "Aprobados", valor: notas?.resumen?.cursosAprobados ?? "—", color: "#2e7d32", bg: "#e8f5e9" },
                  { label: "Reprobados", valor: notas?.resumen?.cursosReprobados ?? "—", color: "#c62828", bg: "#ffebee" },
                  { label: "Créditos", valor: notas?.resumen?.creditosAprobados ?? "—", color: "#e65100", bg: "#fff3e0" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "10px 14px", borderRadius: "8px", background: s.bg, textAlign: "center", minWidth: "100px" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: s.color }}>{s.valor}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "4px", marginBottom: "16px", borderBottom: "1px solid #eee" }}>
                {[
                  { id: "notas", label: "📝 Notas" },
                  { id: "solvencia", label: "💳 Solvencia" },
                  { id: "graduacion", label: "🎓 Graduación" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setTabActiva(t.id)} style={{
                    padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                    borderBottom: tabActiva === t.id ? "2px solid #1976d2" : "2px solid transparent",
                    color: tabActiva === t.id ? "#1976d2" : "#666", fontWeight: tabActiva === t.id ? 700 : 400,
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {tabActiva === "notas" && notas && (
                <table className="table">
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Curso</th><th>Período</th><th className="text-center">Zona</th><th className="text-center">Final</th><th className="text-center">Nota</th><th className="text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(notas.notas ?? []).map((n, i) => (
                      <tr key={i}>
                        <td><strong>{n.curso}</strong><br /><small>{n.nombreCurso}</small></td>
                        <td>{n.periodo}</td>
                        <td className="text-center">{n.zona}</td>
                        <td className="text-center">{n.examenFinal}</td>
                        <td className="text-center" style={{ fontWeight: 700, color: n.notaFinal >= 61 ? "#2e7d32" : "#c62828" }}>{n.notaFinal}</td>
                        <td className="text-center">{n.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tabActiva === "solvencia" && solvencia && (
                <div style={{ padding: "14px 16px", borderRadius: "8px", background: solvencia.solvente ? "#e8f5e9" : "#ffebee" }}>
                  <h6>Solvencia Económica (Grupo 6)</h6>
                  <p><strong>Estado:</strong> {solvencia.solvente ? "✅ Solvente" : "❌ Con Mora"}</p>
                  {solvencia.total_pendiente && <p><strong>Pendiente:</strong> Q{solvencia.total_pendiente}</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Editar Notas ─────────────────────────────────────────────────────
function ModalEditarNotas({ alumno, onCerrar }) {
  const [cursos, setCursos] = useState([
    { id: 1, curso: "MAT101", nombre: "Matemática I", zona: 28, examenFinal: 35 },
    { id: 2, curso: "SIS201", nombre: "Programación II", zona: 32, examenFinal: 40 },
  ]);
  const [guardando, setGuardando] = useState(false);

  const handleChange = (id, campo, valor) => {
    setCursos(prev => prev.map(c => c.id === id ? { ...c, [campo]: Number(valor) } : c));
  };

  const guardar = () => {
    setGuardando(true);
    setTimeout(() => {
      alert(`Notas guardadas para ${alumno.nombre}`);
      onCerrar();
      setGuardando(false);
    }, 800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "780px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "2px solid #1976d2", display: "flex", justifyContent: "space-between" }}>
          <h5>✏️ Editar Notas — {alumno.nombre}</h5>
          <button onClick={onCerrar}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <table className="table">
            <thead><tr><th>Curso</th><th>Zona</th><th>Examen Final</th><th>Nota Final</th></tr></thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.curso}</strong> - {c.nombre}</td>
                  <td><input type="number" value={c.zona} onChange={e => handleChange(c.id, 'zona', e.target.value)} style={{ width: "70px" }} min="0" max="40" /></td>
                  <td><input type="number" value={c.examenFinal} onChange={e => handleChange(c.id, 'examenFinal', e.target.value)} style={{ width: "80px" }} min="0" max="60" /></td>
                  <td style={{ fontWeight: 700, color: (c.zona + c.examenFinal) >= 61 ? "#2e7d32" : "#c62828" }}>{c.zona + c.examenFinal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "15px 24px", textAlign: "right", borderTop: "1px solid #eee" }}>
          <button onClick={onCerrar}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ background: "#1976d2", color: "white", padding: "10px 20px", marginLeft: "10px" }}>
            {guardando ? "Guardando..." : "Guardar Notas"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Asistencias ─────────────────────────────────────────────────────
function ModalAsistencias({ alumno, onCerrar }) {
  const [asistencias, setAsistencias] = useState([
    { fecha: "2026-05-10", presente: true },
    { fecha: "2026-05-17", presente: false },
    { fecha: "2026-05-24", presente: true },
  ]);

  const toggle = (index) => {
    setAsistencias(prev => prev.map((a, i) => i === index ? { ...a, presente: !a.presente } : a));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "600px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "2px solid #1976d2" }}>
          <h5>📅 Asistencias — {alumno.nombre}</h5>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <table className="table">
            <thead><tr><th>Fecha</th><th>Asistencia</th></tr></thead>
            <tbody>
              {asistencias.map((a, i) => (
                <tr key={i}>
                  <td>{a.fecha}</td>
                  <td>
                    <button onClick={() => toggle(i)} style={{ padding: "6px 14px", borderRadius: "999px", background: a.presente ? "#e8f5e9" : "#ffebee" }}>
                      {a.presente ? "✅ Presente" : "❌ Ausente"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "15px 24px", textAlign: "right" }}>
          <button onClick={onCerrar} style={{ background: "#1976d2", color: "white" }}>Guardar Asistencias</button>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal Guía ───────────────────────────────────────────────────
export default function GuiaAdminPage() {
  const [usuario, setUsuario] = useState(null);
  const [tabActiva, setTabActiva] = useState("Alumnos");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalEditarNotas, setModalEditarNotas] = useState(null);
  const [modalAsistencias, setModalAsistencias] = useState(null);

  const [alumnos, setAlumnos] = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [cursos, setCursos] = useState([]);

  const [solicitudes, setSolicitudes] = useState([
    { id: 1, carnet: "2021001", nombre: "Carlos Andrés Pérez López", fecha: "2026-06-02", estado: "pendiente", motivo: "Completó todos los créditos" },
    { id: 2, carnet: "2019003", nombre: "José Roberto Méndez Cruz", fecha: "2026-06-03", estado: "pendiente", motivo: "Pendiente revisión" },
  ]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { window.location.href = "/login"; return; }
    const u = JSON.parse(raw);
    if (!["ADMIN","TEACHER"].includes(u.role)) { window.location.href = "/login"; return; }
    setUsuario(u);
    cargarDatosGrupo1();
  }, []);

  const cargarDatosGrupo1 = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/sistema-academico/alumnos"),
        fetch("/api/sistema-academico/catedraticos"),
        fetch("/api/sistema-academico/cursos"),
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      setAlumnos(d1.success ? d1.data : []);
      setCatedraticos(d2.success ? d2.data : []);
      setCursos(d3.success ? d3.data : []);
    } catch (e) {
      console.error("Error cargando Grupo 1", e);
    }
  };

  const aprobarCierre = (id) => {
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: "aprobado" } : s));
    setMensaje({ tipo: "ok", texto: "Solicitud de cierre aprobada" });
    setTimeout(() => setMensaje(null), 3000);
  };

  const rechazarCierre = (id) => {
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: "rechazado" } : s));
    setMensaje({ tipo: "error", texto: "Solicitud rechazada" });
    setTimeout(() => setMensaje(null), 3000);
  };

  const alumnosFiltrados = alumnos.filter(a =>
    [a.carnet, `${a.nombre} ${a.apellido}`, a.email].some(v => String(v).toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <>
      {modalDetalle && <ModalDetalleAlumno carnet={modalDetalle.carnet} nombre={`${modalDetalle.nombre} ${modalDetalle.apellido}`} onCerrar={() => setModalDetalle(null)} />}
      {modalEditarNotas && <ModalEditarNotas alumno={modalEditarNotas} onCerrar={() => setModalEditarNotas(null)} />}
      {modalAsistencias && <ModalAsistencias alumno={modalAsistencias} onCerrar={() => setModalAsistencias(null)} />}

      <div className="row clearfix">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1976d2" }}>
              <div>
                <h3 style={{ color: "#0d47a1", marginBottom: "4px" }}>👨‍🏫 Panel de Guía Académico</h3>
                <p style={{ color: "#888", margin: 0 }}>Administración + Gestión de Estudiantes</p>
              </div>
            </div>

            <div className="card-body">
              {mensaje && (
                <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", background: mensaje.tipo === "ok" ? "#e8f5e9" : "#ffebee", color: mensaje.tipo === "ok" ? "#2e7d32" : "#c62828" }}>
                  {mensaje.texto}
                </div>
              )}

              <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #f0f0f0", flexWrap: "wrap" }}>
                {["Alumnos", "Catedráticos", "Cursos", "Solicitudes de Cierre"].map((tab) => (
                  <button key={tab} onClick={() => setTabActiva(tab)} style={{
                    padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                    borderBottom: tabActiva === tab ? "3px solid #1976d2" : "3px solid transparent",
                    color: tabActiva === tab ? "#1976d2" : "#666", fontWeight: tabActiva === tab ? 700 : 400,
                  }}>
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <input className="form-control" placeholder="🔍 Buscar por nombre, carnet..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ maxWidth: "360px" }} />
              </div>

              {/* Tab Alumnos */}
              {tabActiva === "Alumnos" && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Carnet</th><th>Nombre</th><th>Carrera</th><th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.carnet}</td>
                        <td>{a.nombre} {a.apellido}</td>
                        <td>{a.carrera?.nombre || "—"}</td>
                        <td className="text-center">
                          <button className="btn btn-sm" style={{ background: "#1976d2", color: "white", margin: "2px" }} onClick={() => setModalDetalle(a)}>Detalle</button>
                          <button className="btn btn-sm" style={{ background: "#ff9800", color: "white", margin: "2px" }} onClick={() => setModalEditarNotas(a)}>Editar Notas</button>
                          <button className="btn btn-sm" style={{ background: "#1976d2", color: "white", margin: "2px" }} onClick={() => setModalAsistencias(a)}>Asistencias</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab Catedráticos */}
              {tabActiva === "Catedráticos" && (
                <table className="table">
                  <thead><tr><th>Código</th><th>Nombre</th><th>Email</th></tr></thead>
                  <tbody>
                    {catedraticos.map(c => (
                      <tr key={c.id}>
                        <td>{c.codigo}</td>
                        <td>{c.nombre} {c.apellido}</td>
                        <td>{c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab Cursos */}
              {tabActiva === "Cursos" && (
                <table className="table">
                  <thead><tr><th>Código</th><th>Nombre</th><th>Créditos</th></tr></thead>
                  <tbody>
                    {cursos.map(c => (
                      <tr key={c.id}>
                        <td>{c.codigo}</td>
                        <td>{c.nombre}</td>
                        <td>{c.creditos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab Solicitudes de Cierre */}
              {tabActiva === "Solicitudes de Cierre" && (
                <div>
                  <h5>Solicitudes de Cierre de Pensum</h5>
                  <table className="table">
                    <thead><tr><th>Carnet</th><th>Alumno</th><th>Fecha</th><th>Motivo</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>
                      {solicitudes.map(s => (
                        <tr key={s.id}>
                          <td>{s.carnet}</td>
                          <td>{s.nombre}</td>
                          <td>{s.fecha}</td>
                          <td>{s.motivo}</td>
                          <td>{s.estado}</td>
                          <td>
                            {s.estado === "pendiente" && (
                              <>
                                <button onClick={() => aprobarCierre(s.id)} style={{ background: "#2e7d32", color: "white", border: "none", borderRadius: "6px", padding: "4px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginRight: "6px" }}>Aprobar</button>
                                <button onClick={() => rechazarCierre(s.id)} style={{ background: "#c62828", color: "white", border: "none", borderRadius: "6px", padding: "4px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Rechazar</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
