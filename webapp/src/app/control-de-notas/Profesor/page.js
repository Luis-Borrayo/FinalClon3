"use client";

import { useEffect, useState } from "react";

// ── APIs que consumimos ───────────────────────────────────────────────────────
// GET /api/control-de-notas/notas/:carnet         (ver notas de sus alumnos)
// GET /api/control-de-notas/asistencias/:carnet/:curso
// ─────────────────────────────────────────────────────────────────────────────

// ── Modal para ver notas de un alumno ─────────────────────────────────────────
function ModalNotasAlumno({ alumno, onCerrar }) {
  const [notas,    setNotas]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res  = await fetch(`/api/control-de-notas/notas/${alumno.carnet}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setNotas(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [alumno.carnet]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "white", borderRadius: "12px", width: "100%",
        maxWidth: "700px", maxHeight: "85vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header modal */}
        <div style={{
          padding: "20px 24px", borderBottom: "2px solid #ff9800",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "white", zIndex: 1,
        }}>
          <div>
            <h5 style={{ margin: 0, color: "#333" }}>
              📝 Notas — {alumno.nombre}
            </h5>
            <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>
              Carnet: {alumno.carnet}
            </p>
          </div>
          <button onClick={onCerrar} style={{
            background: "#f5f5f5", border: "none", borderRadius: "8px",
            padding: "8px 14px", cursor: "pointer", fontSize: "16px",
          }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {cargando && <p style={{ textAlign: "center", color: "#888" }}>⏳ Cargando notas...</p>}
          {error    && <p style={{ color: "#c62828" }}>⚠️ {error}</p>}
          {notas && (
            <>
              {/* Resumen */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                {[
                  { label: "Promedio",   valor: notas.resumen?.promedioGeneral,   color: "#1976d2", bg: "#e3f2fd" },
                  { label: "Aprobados",  valor: notas.resumen?.cursosAprobados,   color: "#2e7d32", bg: "#e8f5e9" },
                  { label: "Reprobados", valor: notas.resumen?.cursosReprobados,  color: "#c62828", bg: "#ffebee" },
                  { label: "Créditos",   valor: notas.resumen?.creditosAprobados, color: "#e65100", bg: "#fff3e0" },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: "10px 16px", borderRadius: "8px",
                    background: s.bg, textAlign: "center", minWidth: "100px",
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "20px", color: s.color }}>{s.valor}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabla notas */}
              <table className="table" style={{ width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9" }}>
                    <th>Curso</th>
                    <th>Período</th>
                    <th className="text-center">Zona</th>
                    <th className="text-center">Final</th>
                    <th className="text-center">Nota</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(notas.notas ?? []).map((n, i) => (
                    <tr key={i} style={{ background: n.estado === "reprobado" ? "#fff8f8" : "white" }}>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: "12px" }}>{n.curso}</span>
                        <br />
                        <span style={{ fontSize: "12px", color: "#888" }}>{n.nombreCurso}</span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#888" }}>{n.periodo}</td>
                      <td className="text-center">{n.zona}</td>
                      <td className="text-center">{n.examenFinal}</td>
                      <td className="text-center">
                        <span style={{
                          fontWeight: 700,
                          color: n.notaFinal >= 61 ? "#2e7d32" : "#c62828",
                        }}>{n.notaFinal}</span>
                      </td>
                      <td className="text-center">
                        <span style={{
                          padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                          background: n.estado === "aprobado" ? "#e8f5e9" : "#ffebee",
                          color: n.estado === "aprobado" ? "#2e7d32" : "#c62828",
                        }}>
                          {n.estado === "aprobado" ? "✅ Aprobado" : "❌ Reprobado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfesorPage() {
  const [usuario,        setUsuario]        = useState(null);
  const [tabActiva,      setTabActiva]      = useState("mis-alumnos");
  const [busqueda,       setBusqueda]       = useState("");
  const [modalAlumno,    setModalAlumno]    = useState(null);

  // Alumnos del mock (los que el profe puede consultar)
  const alumnosMock = [
    { carnet: "2021001", nombre: "Carlos Andrés Pérez López",      carrera: "Ingeniería en Sistemas"    },
    { carnet: "2021002", nombre: "María Fernanda García Ramos",    carrera: "Administración de Empresas" },
    { carnet: "2019003", nombre: "José Roberto Méndez Cruz",       carrera: "Ingeniería en Sistemas"    },
    { carnet: "2020004", nombre: "Ana Lucía Rodríguez Vásquez",    carrera: "Contaduría Pública"        },
    { carnet: "2018005", nombre: "Luis Enrique Torres Molina",     carrera: "Ingeniería en Sistemas"    },
  ];

  // Notas cargadas por alumno { carnet: data }
  const [notasPorAlumno, setNotasPorAlumno] = useState({});
  const [cargandoNotas,  setCargandoNotas]  = useState({});

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { window.location.href = "/login"; return; }
    const u = JSON.parse(raw);
    if (u.role !== "TEACHER") { window.location.href = "/login"; return; }
    setUsuario(u);
  }, []);

  const cargarNotasAlumno = async (carnet) => {
    if (notasPorAlumno[carnet]) return; // ya cargado
    setCargandoNotas((p) => ({ ...p, [carnet]: true }));
    try {
      const res  = await fetch(`/api/control-de-notas/notas/${carnet}`);
      const data = await res.json();
      if (data.success) {
        setNotasPorAlumno((p) => ({ ...p, [carnet]: data }));
      }
    } finally {
      setCargandoNotas((p) => ({ ...p, [carnet]: false }));
    }
  };

  const alumnosFiltrados = alumnosMock.filter((a) =>
    [a.carnet, a.nombre, a.carrera].some((v) =>
      v.toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <>
      {modalAlumno && (
        <ModalNotasAlumno
          alumno={modalAlumno}
          onCerrar={() => setModalAlumno(null)}
        />
      )}

      <div className="row clearfix">
        <div className="col-lg-12">
          <div className="card">

            {/* ── Header ── */}
            <div className="card-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "2px solid #ff9800",
            }}>
              <div>
                <h3 style={{ color: "#e65100", marginBottom: "4px" }}>
                  👨‍🏫 {usuario?.nombre} {usuario?.apellido}
                </h3>
                <p style={{ color: "#888", margin: 0 }}>
                  Código: {usuario?.id} | Panel Catedrático
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge" style={{
                  background: "#fff3e0", color: "#e65100",
                  padding: "8px 16px", borderRadius: "20px",
                }}>
                  ✏️ {alumnosMock.length} alumnos en sistema
                </span>
              </div>
            </div>

            <div className="card-body">

              {/* ── Tabs ── */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #f0f0f0" }}>
                {[
                  { id: "mis-alumnos", label: "👨‍🎓 Mis Alumnos" },
                  { id: "resumen",     label: "📊 Resumen del Grupo" },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setTabActiva(tab.id)} style={{
                    padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                    borderBottom: tabActiva === tab.id ? "3px solid #ff9800" : "3px solid transparent",
                    color: tabActiva === tab.id ? "#e65100" : "#666",
                    fontWeight: tabActiva === tab.id ? 700 : 400,
                    fontSize: "14px", marginBottom: "-2px",
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Buscador ── */}
              <div style={{ marginBottom: "16px" }}>
                <input
                  className="form-control"
                  placeholder="🔍 Buscar alumno por nombre o carnet..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ maxWidth: "360px" }}
                />
              </div>

              {/* ── Tab: Mis Alumnos ── */}
              {tabActiva === "mis-alumnos" && (
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      <th>Carnet</th>
                      <th>Nombre</th>
                      <th>Carrera</th>
                      <th className="text-center">Promedio</th>
                      <th className="text-center">Aprobados</th>
                      <th className="text-center">Reprobados</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map((a) => {
                      const datos    = notasPorAlumno[a.carnet];
                      const cargando = cargandoNotas[a.carnet];

                      return (
                        <tr key={a.carnet}>
                          <td style={{ fontWeight: 600 }}>{a.carnet}</td>
                          <td>{a.nombre}</td>
                          <td style={{ fontSize: "13px", color: "#666" }}>{a.carrera}</td>
                          <td className="text-center">
                            {cargando ? "⏳" : datos
                              ? <span style={{ fontWeight: 700, color: "#1976d2" }}>{datos.resumen?.promedioGeneral}</span>
                              : <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>}
                          </td>
                          <td className="text-center">
                            {datos
                              ? <span style={{ color: "#2e7d32", fontWeight: 600 }}>{datos.resumen?.cursosAprobados}</span>
                              : <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td className="text-center">
                            {datos
                              ? <span style={{ color: datos.resumen?.cursosReprobados > 0 ? "#c62828" : "#2e7d32", fontWeight: 600 }}>
                                  {datos.resumen?.cursosReprobados}
                                </span>
                              : <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td className="text-center" style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#ff9800", color: "white", fontSize: "12px" }}
                              onClick={() => {
                                cargarNotasAlumno(a.carnet);
                                setModalAlumno(a);
                              }}
                            >
                              📝 Ver notas
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: "#e3f2fd", color: "#1976d2", fontSize: "12px" }}
                              onClick={() => cargarNotasAlumno(a.carnet)}
                            >
                              🔄
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* ── Tab: Resumen del grupo ── */}
              {tabActiva === "resumen" && (
                <div>
                  <div style={{
                    padding: "12px 16px", marginBottom: "16px", borderRadius: "8px",
                    background: "#fff3e0", border: "1px solid #ffcc80",
                    fontSize: "13px", color: "#795548",
                  }}>
                    💡 Cargá las notas de cada alumno con el botón 🔄 para ver el resumen completo.
                  </div>

                  <table className="table" style={{ width: "100%" }}>
                    <thead>
                      <tr style={{ background: "#f9f9f9" }}>
                        <th>Carnet</th>
                        <th>Nombre</th>
                        <th className="text-center">Promedio</th>
                        <th className="text-center">Créditos</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosMock.map((a) => {
                        const datos = notasPorAlumno[a.carnet];
                        const reprobados = datos?.resumen?.cursosReprobados ?? 0;
                        const promedio   = datos?.resumen?.promedioGeneral   ?? null;

                        return (
                          <tr key={a.carnet}>
                            <td style={{ fontWeight: 600 }}>{a.carnet}</td>
                            <td>{a.nombre}</td>
                            <td className="text-center">
                              {promedio !== null
                                ? <span style={{
                                    fontWeight: 700,
                                    color: promedio >= 61 ? "#2e7d32" : "#c62828",
                                  }}>{promedio}</span>
                                : <span style={{ color: "#ccc", fontSize: "12px" }}>Sin cargar</span>}
                            </td>
                            <td className="text-center">
                              {datos ? datos.resumen?.creditosAprobados : <span style={{ color: "#ccc" }}>—</span>}
                            </td>
                            <td className="text-center">
                              {!datos
                                ? <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>
                                : reprobados === 0
                                  ? <span style={{ color: "#2e7d32", fontWeight: 600 }}>✅ Al día</span>
                                  : <span style={{ color: "#c62828", fontWeight: 600 }}>⚠️ {reprobados} reprobado(s)</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Aviso */}
              <div style={{
                marginTop: "20px", padding: "12px 16px", borderRadius: "8px",
                background: "#f3e5f5", border: "1px solid #ce93d8",
                fontSize: "13px", color: "#4a148c",
              }}>
                📝 <strong>Ingreso / edición de notas:</strong> disponible cuando se integre la base de datos del módulo de Control de Notas.
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}