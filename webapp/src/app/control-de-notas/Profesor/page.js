"use client";

import { useEffect, useState } from "react";

// ── Modal Ver Notas ─────────────────────────────────────────────────────
function ModalNotasAlumno({ alumno, onCerrar }) {
  const [notas, setNotas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`/api/control-de-notas/notas/${alumno.carnet}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Error al cargar notas");
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "700px", maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "2px solid #ff9800", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div>
            <h5 style={{ margin: 0, color: "#333" }}>📝 Notas — {alumno.nombre}</h5>
            <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Carnet: {alumno.carnet}</p>
          </div>
          <button onClick={onCerrar} style={{ background: "#f5f5f5", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {cargando && <p style={{ textAlign: "center" }}>Cargando notas...</p>}
          {error && <p style={{ color: "#c62828" }}>{error}</p>}
          {notas && (
            <>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                {[
                  { label: "Promedio", valor: notas.resumen?.promedioGeneral, color: "#1976d2", bg: "#e3f2fd" },
                  { label: "Aprobados", valor: notas.resumen?.cursosAprobados, color: "#2e7d32", bg: "#e8f5e9" },
                  { label: "Reprobados", valor: notas.resumen?.cursosReprobados, color: "#c62828", bg: "#ffebee" },
                  { label: "Créditos", valor: notas.resumen?.creditosAprobados, color: "#e65100", bg: "#fff3e0" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "10px 16px", borderRadius: "8px", background: s.bg, textAlign: "center", minWidth: "100px" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "20px", color: s.color }}>{s.valor}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <table className="table" style={{ width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9" }}>
                    <th>Curso</th><th>Período</th><th className="text-center">Zona</th><th className="text-center">Final</th><th className="text-center">Nota</th><th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(notas.notas ?? []).map((n, i) => (
                    <tr key={i} style={{ background: n.estado === "reprobado" ? "#fff8f8" : "white" }}>
                      <td><span style={{ fontWeight: 600 }}>{n.curso}</span><br /><span style={{ fontSize: "12px", color: "#888" }}>{n.nombreCurso}</span></td>
                      <td>{n.periodo}</td>
                      <td className="text-center">{n.zona}</td>
                      <td className="text-center">{n.examenFinal}</td>
                      <td className="text-center" style={{ fontWeight: 700, color: n.notaFinal >= 61 ? "#2e7d32" : "#c62828" }}>{n.notaFinal}</td>
                      <td className="text-center">
                        <span style={{ padding: "4px 10px", borderRadius: "999px", background: n.estado === "aprobado" ? "#e8f5e9" : "#ffebee", color: n.estado === "aprobado" ? "#2e7d32" : "#c62828" }}>
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
      alert(`✅ Notas guardadas para ${alumno.nombre}`);
      onCerrar();
      setGuardando(false);
    }, 800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "780px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "2px solid #ff9800", display: "flex", justifyContent: "space-between" }}>
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
          <button onClick={guardar} disabled={guardando} style={{ background: "#ff9800", color: "white", padding: "10px 20px", marginLeft: "10px" }}>
            {guardando ? "Guardando..." : "💾 Guardar Cambios"}
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
    { fecha: "2026-05-31", presente: true },
  ]);

  const toggle = (index) => {
    setAsistencias(prev => prev.map((a, i) => i === index ? { ...a, presente: !a.presente } : a));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "600px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "2px solid #ff9800" }}>
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
                    <button onClick={() => toggle(i)} style={{ padding: "6px 14px", borderRadius: "999px", background: a.presente ? "#e8f5e9" : "#ffebee", color: a.presente ? "#2e7d32" : "#c62828" }}>
                      {a.presente ? "✅ Presente" : "❌ Ausente"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "15px 24px", textAlign: "right" }}>
          <button onClick={onCerrar} style={{ background: "#ff9800", color: "white" }}>Guardar Asistencias</button>
        </div>
      </div>
    </div>
  );
}

// ── Página Profesor ───────────────────────────────────────────────────────
export default function ProfesorPage() {
  const [usuario, setUsuario] = useState(null);
  const [tabActiva, setTabActiva] = useState("mis-alumnos");
  const [busqueda, setBusqueda] = useState("");
  const [modalAlumno, setModalAlumno] = useState(null);
  const [modalEditarNotas, setModalEditarNotas] = useState(null);
  const [modalAsistencias, setModalAsistencias] = useState(null);

  const alumnosMock = [
    { carnet: "2021001", nombre: "Carlos Andrés Pérez López", carrera: "Ingeniería en Sistemas" },
    { carnet: "2021002", nombre: "María Fernanda García Ramos", carrera: "Administración de Empresas" },
    { carnet: "2019003", nombre: "José Roberto Méndez Cruz", carrera: "Ingeniería en Sistemas" },
    { carnet: "2020004", nombre: "Ana Lucía Rodríguez Vásquez", carrera: "Contaduría Pública" },
    { carnet: "2018005", nombre: "Luis Enrique Torres Molina", carrera: "Ingeniería en Sistemas" },
  ];

  const [notasPorAlumno, setNotasPorAlumno] = useState({});

  useEffect(() => {
    const raw = sessionStorage.getItem("cn_usuario");
    if (!raw) { window.location.href = "/control-de-notas"; return; }
    const u = JSON.parse(raw);
    if (u.rol !== "CATEDRATICO") { window.location.href = "/control-de-notas"; return; }
    setUsuario(u);
  }, []);

  const alumnosFiltrados = alumnosMock.filter(a =>
    [a.carnet, a.nombre, a.carrera].some(v => v.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <>
      {modalAlumno && <ModalNotasAlumno alumno={modalAlumno} onCerrar={() => setModalAlumno(null)} />}
      {modalEditarNotas && <ModalEditarNotas alumno={modalEditarNotas} onCerrar={() => setModalEditarNotas(null)} />}
      {modalAsistencias && <ModalAsistencias alumno={modalAsistencias} onCerrar={() => setModalAsistencias(null)} />}

      <div className="row clearfix">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #ff9800" }}>
              <div>
                <h3 style={{ color: "#e65100" }}>👨‍🏫 {usuario?.nombre} {usuario?.apellido}</h3>
                <p style={{ color: "#888" }}>Panel Catedrático</p>
              </div>
              <a href="/control-de-notas" style={{ color: "#888" }}>Salir</a>
            </div>

            <div className="card-body">
              <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #f0f0f0" }}>
                {[
                  { id: "mis-alumnos", label: "Mis Alumnos" },
                  { id: "editar-notas", label: "Editar Notas" },
                  { id: "asistencias", label: "Asistencias" },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setTabActiva(tab.id)} style={{
                    padding: "10px 20px", borderBottom: tabActiva === tab.id ? "3px solid #ff9800" : "none",
                    fontWeight: tabActiva === tab.id ? 700 : 400, color: tabActiva === tab.id ? "#e65100" : "#666"
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <input className="form-control" placeholder="Buscar alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ maxWidth: "360px", marginBottom: "16px" }} />

              {tabActiva === "mis-alumnos" && (
                <table className="table">
                  <thead><tr><th>Carnet</th><th>Nombre</th><th>Carrera</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {alumnosFiltrados.map(a => (
                      <tr key={a.carnet}>
                        <td>{a.carnet}</td>
                        <td>{a.nombre}</td>
                        <td>{a.carrera}</td>
                        <td>
                          <button onClick={() => setModalAlumno(a)}>Ver Notas</button>
                          <button onClick={() => setModalEditarNotas(a)}>Editar Notas</button>
                          <button onClick={() => setModalAsistencias(a)}>Asistencias</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tabActiva === "editar-notas" && (
                <table className="table">
                  <thead><tr><th>Carnet</th><th>Alumno</th><th>Acción</th></tr></thead>
                  <tbody>
                    {alumnosMock.map(a => (
                      <tr key={a.carnet}>
                        <td>{a.carnet}</td>
                        <td>{a.nombre}</td>
                        <td><button onClick={() => setModalEditarNotas(a)}>Editar Notas</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {tabActiva === "asistencias" && (
                <table className="table">
                  <thead><tr><th>Carnet</th><th>Alumno</th><th>Acción</th></tr></thead>
                  <tbody>
                    {alumnosMock.map(a => (
                      <tr key={a.carnet}>
                        <td>{a.carnet}</td>
                        <td>{a.nombre}</td>
                        <td><button onClick={() => setModalAsistencias(a)}>Gestionar Asistencias</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
