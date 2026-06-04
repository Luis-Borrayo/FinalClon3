import mockData from "./mockData.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const alumnoExiste = (carnet) =>
  mockData.alumnos.some((a) => a.carnet === carnet);

const getAlumno = (carnet) =>
  mockData.alumnos.find((a) => a.carnet === carnet);

const calcularPromedio = (notas) => {
  if (!notas || notas.length === 0) return 0;
  const suma = notas.reduce((acc, n) => acc + n.notaFinal, 0);
  return parseFloat((suma / notas.length).toFixed(2));
};

const calcularCreditosAprobados = (notas) =>
  notas
    .filter((n) => n.estado === "aprobado")
    .reduce((acc, n) => acc + n.creditos, 0);

// ─── Constantes ───────────────────────────────────────────────────────────────

export const ZONA_MINIMA_EXAMEN  = 41;
export const NOTA_MINIMA_APROBAR = 61;

// ─── Helpers de notas ─────────────────────────────────────────────────────────

export const calcularNotaFinal = (zona, examen) =>
  parseFloat(((zona * 0.6) + (examen * 0.4)).toFixed(2));

export const tieneDerechoExamen = (zona) => zona >= ZONA_MINIMA_EXAMEN;

export const determinarEstado = (zona, examen) => {
  if (!tieneDerechoExamen(zona)) return "reprobado";
  const final = calcularNotaFinal(zona, examen);
  return final >= NOTA_MINIMA_APROBAR ? "aprobado" : "reprobado";
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/control-de-notas/notas/[carnet]
// ─────────────────────────────────────────────────────────────────────────────

export const getNotasByCarnet = (carnet) => {
  if (!alumnoExiste(carnet))
    return { success: false, status: 404, message: "Alumno no encontrado" };

  const alumno   = getAlumno(carnet);
  const notas    = mockData.notas[carnet] || [];
  const aprobados  = notas.filter((n) => n.estado === "aprobado");
  const reprobados = notas.filter((n) => n.estado === "reprobado");

  return {
    success: true,
    data: {
      alumno: { carnet: alumno.carnet, nombre: alumno.nombre, carrera: alumno.carrera },
      resumen: {
        totalCursos:       notas.length,
        cursosAprobados:   aprobados.length,
        cursosReprobados:  reprobados.length,
        promedioGeneral:   calcularPromedio(notas),
        promedioAprobados: calcularPromedio(aprobados),
        creditosAprobados: calcularCreditosAprobados(notas),
      },
      notas,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/control-de-notas/asistencias/[carnet]/[curso]
// ─────────────────────────────────────────────────────────────────────────────

export const getAsistenciasByCarnetYCurso = (carnet, curso) => {
  if (!alumnoExiste(carnet))
    return { success: false, status: 404, message: "Alumno no encontrado" };

  const asistenciasAlumno = mockData.asistencias[carnet];
  if (!asistenciasAlumno)
    return { success: false, status: 404, message: "No hay registros de asistencia para este alumno" };

  const asistenciaCurso = asistenciasAlumno[curso.toUpperCase()];
  if (!asistenciaCurso)
    return { success: false, status: 404, message: `No hay registros de asistencia para el curso ${curso}` };

  const alumno = getAlumno(carnet);
  return {
    success: true,
    data: {
      alumno: { carnet: alumno.carnet, nombre: alumno.nombre },
      asistencia: {
        ...asistenciaCurso,
        estadoAsistencia: asistenciaCurso.porcentajeAsistencia >= 80 ? "suficiente" : "insuficiente",
        minimoRequerido: 80,
      },
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/control-de-notas/graduacion/requisitos/[carnet]
// ─────────────────────────────────────────────────────────────────────────────

export const getRequisitosGraduacion = (carnet) => {
  if (!alumnoExiste(carnet))
    return { success: false, status: 404, message: "Alumno no encontrado" };

  const alumno    = getAlumno(carnet);
  const notas     = mockData.notas[carnet] || [];
  const solvencia = mockData.solvenciaPagos[carnet];
  const requisitos = mockData.requisitosGraduacion;

  const cursosAprobados = notas.filter((n) => n.estado === "aprobado").map((n) => n.curso);
  const cursosObligatoriosCumplidos  = requisitos.cursosObligatorios.filter((c) =>  cursosAprobados.includes(c));
  const cursosObligatoriosPendientes = requisitos.cursosObligatorios.filter((c) => !cursosAprobados.includes(c));

  const creditosAprobados = calcularCreditosAprobados(notas);
  const creditosFaltantes = Math.max(0, requisitos.creditosRequeridos - creditosAprobados);

  const cumpleCursos   = cursosObligatoriosPendientes.length === 0;
  const cumpleCreditos = creditosAprobados >= requisitos.creditosRequeridos;
  const cumpleSolvencia = solvencia?.solvente ?? false;
  const aptoParaGraduarse = cumpleCursos && cumpleCreditos && cumpleSolvencia;

  return {
    success: true,
    data: {
      alumno: { carnet: alumno.carnet, nombre: alumno.nombre, carrera: alumno.carrera },
      requisitos: {
        cursosObligatorios: {
          requeridos: requisitos.cursosObligatorios.length,
          cumplidos:  cursosObligatoriosCumplidos.length,
          pendientes: cursosObligatoriosPendientes,
          cumple:     cumpleCursos,
        },
        creditos: {
          requeridos: requisitos.creditosRequeridos,
          obtenidos:  creditosAprobados,
          faltantes:  creditosFaltantes,
          cumple:     cumpleCreditos,
        },
        solvenciaEconomica: {
          solvente:        cumpleSolvencia,
          montoPendiente:  solvencia?.montoPendiente ?? null,
          cumple:          cumpleSolvencia,
        },
        documentosRequeridos: requisitos.documentosRequeridos,
      },
      aptoParaGraduarse,
      resumenEstado: aptoParaGraduarse
        ? "El alumno cumple todos los requisitos de graduación"
        : "El alumno NO cumple todos los requisitos de graduación",
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/control-de-notas/notas/[carnet]/solvencia-estado
// ─────────────────────────────────────────────────────────────────────────────

export const getSolvenciaEstado = (carnet) => {
  if (!alumnoExiste(carnet))
    return { success: false, status: 404, message: "Alumno no encontrado" };

  const alumno        = getAlumno(carnet);
  const notas         = mockData.notas[carnet] || [];
  const solvenciaPagos = mockData.solvenciaPagos[carnet];

  const cursosReprobados = notas.filter((n) => n.estado === "reprobado");
  const tieneReprobados  = cursosReprobados.length > 0;
  const solvente = !tieneReprobados && (solvenciaPagos?.solvente ?? false);

  return {
    success: true,
    data: {
      alumno: { carnet: alumno.carnet, nombre: alumno.nombre },
      solvenciaNotas: {
        solvente: !tieneReprobados,
        cursosReprobados: cursosReprobados.map((c) => ({
          codigo: c.curso, nombre: c.nombreCurso, nota: c.notaFinal, periodo: c.periodo,
        })),
        totalReprobados: cursosReprobados.length,
      },
      solvenciaPagos: {
        solvente:        solvenciaPagos?.solvente       ?? false,
        montoPendiente:  solvenciaPagos?.montoPendiente ?? 0,
      },
      solvenciaGeneral: solvente,
      mensaje: solvente
        ? "Alumno solvente en notas y pagos"
        : "Alumno con pendientes académicos o financieros",
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/control-de-notas/auth
// ─────────────────────────────────────────────────────────────────────────────

export const verificarUsuario = (id, password) => {
  const usuario = mockData.usuarios.find((u) => u.id === id || u.carnet === id);

  if (!usuario)
    return { success: false, status: 404, message: "Usuario no encontrado. Verifica tu carnet o codigo." };

  if (!usuario.activo)
    return { success: false, status: 403, message: "Tu cuenta esta inactiva. Contacta a administracion." };

  if (usuario.password !== password)
    return { success: false, status: 401, message: "Contraseña incorrecta." };

  return {
    success: true,
    data: {
      found:    true,
      id:       usuario.id,
      nombre:   usuario.nombre,
      apellido: usuario.apellido,
      email:    usuario.email,
      rol:      usuario.rol,
      activo:   usuario.activo,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Horarios
// ─────────────────────────────────────────────────────────────────────────────

export const getHorarios = () => {
  const asignaciones = mockData.asignacionesCatedratico ?? [];
  const horarios = (mockData.horarios ?? []).map((h) => {
    const asig = asignaciones.find((a) => a.horarioId === h.id);
    return { ...h, catedratico: asig?.catedratico ?? null };
  });
  return { success: true, data: horarios };
};

export const getHorariosByCatedratico = (codigoCatedratico) => {
  const asignaciones = (mockData.asignacionesCatedratico ?? [])
    .filter((a) => a.catedratico === codigoCatedratico);
  const horarioIds = asignaciones.map((a) => a.horarioId);
  const horarios   = (mockData.horarios ?? []).filter((h) => horarioIds.includes(h.id));
  return { success: true, data: horarios };
};

export const asignarCatedratico = (codigoCatedratico, horarioId) => {
  const horario = (mockData.horarios ?? []).find((h) => h.id === horarioId);
  if (!horario)
    return { success: false, status: 404, message: "Horario no encontrado" };

  const yaAsignado = (mockData.asignacionesCatedratico ?? []).find((a) => a.horarioId === horarioId);
  if (yaAsignado)
    return { success: false, status: 409, message: "Este horario ya tiene catedratico asignado" };

  const nueva = { id: `AC${Date.now()}`, catedratico: codigoCatedratico, horarioId, ciclo: horario.ciclo };
  mockData.asignacionesCatedratico.push(nueva);
  return { success: true, data: nueva, message: "Asignacion realizada correctamente" };
};

export const desasignarCatedratico = (codigoCatedratico, horarioId) => {
  const idx = (mockData.asignacionesCatedratico ?? []).findIndex(
    (a) => a.catedratico === codigoCatedratico && a.horarioId === horarioId
  );
  if (idx === -1)
    return { success: false, status: 404, message: "Asignacion no encontrada" };

  mockData.asignacionesCatedratico.splice(idx, 1);
  return { success: true, message: "Asignacion eliminada" };
};

export const editarHorario = (horarioId, cambios) => {
  const idx = (mockData.horarios ?? []).findIndex((h) => h.id === horarioId);
  if (idx === -1)
    return { success: false, status: 404, message: "Horario no encontrado" };

  mockData.horarios[idx] = { ...mockData.horarios[idx], ...cambios };
  return { success: true, message: "Horario actualizado", data: mockData.horarios[idx] };
};

// ─────────────────────────────────────────────────────────────────────────────
// Notas editar
// ─────────────────────────────────────────────────────────────────────────────

export const editarNota = (carnet, curso, zona, examen) => {
  if (!alumnoExiste(carnet))
    return { success: false, status: 404, message: "Alumno no encontrado" };

  zona   = parseFloat(zona);
  examen = parseFloat(examen);

  if (isNaN(zona)   || zona   < 0 || zona   > 100) return { success: false, status: 400, message: "Zona invalida (0-100)" };
  if (isNaN(examen) || examen < 0 || examen > 100) return { success: false, status: 400, message: "Examen invalido (0-100)" };

  const derechoExamen = tieneDerechoExamen(zona);
  const notaFinal = derechoExamen
    ? calcularNotaFinal(zona, examen)
    : parseFloat((zona * 0.6).toFixed(2));
  const estado = determinarEstado(zona, examen);

  if (!mockData.notasDetalle[carnet]) mockData.notasDetalle[carnet] = {};
  mockData.notasDetalle[carnet][curso] = {
    zona, examenFinal: examen,
    cierreSolicitado: mockData.notasDetalle[carnet]?.[curso]?.cierreSolicitado ?? false,
    cierrePendiente:  mockData.notasDetalle[carnet]?.[curso]?.cierrePendiente  ?? false,
  };

  if (!mockData.notas[carnet]) mockData.notas[carnet] = [];
  const idx       = mockData.notas[carnet].findIndex((n) => n.curso === curso);
  const cursoInfo = (mockData.horarios ?? []).find((h) => h.curso === curso);
  const nuevaNota = {
    curso,
    nombreCurso:  cursoInfo?.nombreCurso ?? curso,
    periodo:      cursoInfo?.ciclo       ?? "2024-1",
    zona, examenFinal: examen, notaFinal, estado,
    creditos: 4, derechoExamen,
  };

  if (idx >= 0) mockData.notas[carnet][idx] = nuevaNota;
  else          mockData.notas[carnet].push(nuevaNota);

  return {
    success: true,
    message: derechoExamen
      ? `Nota actualizada. Nota final: ${notaFinal} - ${estado}`
      : `Zona ${zona} < ${ZONA_MINIMA_EXAMEN}: SIN derecho a examen. Reprobado automaticamente.`,
    data: nuevaNota,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes de cierre
// ─────────────────────────────────────────────────────────────────────────────

export const solicitarCierreNotas = (codigoCatedratico, horarioId, observaciones) => {
  const horario = (mockData.horarios ?? []).find((h) => h.id === horarioId);
  if (!horario)
    return { success: false, status: 404, message: "Horario no encontrado" };

  const yaExiste = (mockData.solicitudesCierre ?? []).find(
    (s) => s.horarioId === horarioId && s.estado === "pendiente"
  );
  if (yaExiste)
    return { success: false, status: 409, message: "Ya existe una solicitud pendiente para este curso" };

  const nueva = {
    id:             `SC${Date.now()}`,
    catedratico:    codigoCatedratico,
    horarioId,
    curso:          horario.curso,
    nombreCurso:    horario.nombreCurso,
    ciclo:          horario.ciclo,
    estado:         "pendiente",
    fechaSolicitud: new Date().toISOString().split("T")[0],
    observaciones:  observaciones ?? "",
  };

  if (!mockData.solicitudesCierre) mockData.solicitudesCierre = [];
  mockData.solicitudesCierre.push(nueva);
  return { success: true, message: "Solicitud de cierre enviada correctamente", data: nueva };
};

export const getSolicitudesCierre = (filtro = {}) => {
  let lista = mockData.solicitudesCierre ?? [];
  if (filtro.catedratico) lista = lista.filter((s) => s.catedratico === filtro.catedratico);
  if (filtro.estado)      lista = lista.filter((s) => s.estado      === filtro.estado);
  return { success: true, data: lista };
};

export const procesarSolicitudCierre = (solicitudId, accion, comentario) => {
  const idx = (mockData.solicitudesCierre ?? []).findIndex((s) => s.id === solicitudId);
  if (idx === -1)
    return { success: false, status: 404, message: "Solicitud no encontrada" };

  mockData.solicitudesCierre[idx].estado       = accion;
  mockData.solicitudesCierre[idx].comentario   = comentario ?? "";
  mockData.solicitudesCierre[idx].fechaProceso = new Date().toISOString().split("T")[0];

  return { success: true, message: `Solicitud ${accion} correctamente`, data: mockData.solicitudesCierre[idx] };
};

// ─────────────────────────────────────────────────────────────────────────────
// Historial
// ─────────────────────────────────────────────────────────────────────────────

export const getHistorialAlumno = (carnet) => {
  if (!alumnoExiste(carnet))
    return { success: false, status: 404, message: "Alumno no encontrado" };

  const alumno = getAlumno(carnet);
  const notas  = mockData.notas[carnet] ?? [];

  const porPeriodo = {};
  notas.forEach((n) => {
    if (!porPeriodo[n.periodo]) porPeriodo[n.periodo] = [];
    porPeriodo[n.periodo].push(n);
  });

  const periodos = Object.entries(porPeriodo)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([periodo, cursos]) => ({
      periodo,
      cursos,
      promedioperiodo: calcularPromedio(cursos),
      aprobados:  cursos.filter((c) => c.estado === "aprobado").length,
      reprobados: cursos.filter((c) => c.estado === "reprobado").length,
    }));

  return {
    success: true,
    data: {
      alumno: { carnet: alumno.carnet, nombre: alumno.nombre, carrera: alumno.carrera },
      totalPeriodos:      periodos.length,
      promedioGeneral:    calcularPromedio(notas),
      creditosAcumulados: calcularCreditosAprobados(notas),
      historial:          periodos,
    },
  };
};

export const getHistorialCatedratico = (codigoCatedratico) => {
  const asignaciones  = (mockData.asignacionesCatedratico ?? []).filter((a) => a.catedratico === codigoCatedratico);
  const horarioIds    = asignaciones.map((a) => a.horarioId);
  const horariosAsig  = (mockData.horarios ?? []).filter((h) => horarioIds.includes(h.id));
  const solicitudes   = (mockData.solicitudesCierre ?? []).filter((s) => s.catedratico === codigoCatedratico);

  const porCiclo = {};
  horariosAsig.forEach((h) => {
    if (!porCiclo[h.ciclo]) porCiclo[h.ciclo] = [];
    porCiclo[h.ciclo].push(h);
  });

  return {
    success: true,
    data: {
      totalCursosImpartidos: horariosAsig.length,
      solicitudesCierre:     solicitudes,
      historialPorCiclo: Object.entries(porCiclo).map(([ciclo, horarios]) => ({
        ciclo,
        horarios,
        cierresAprobados: solicitudes.filter((s) => s.ciclo === ciclo && s.estado === "aprobado").length,
      })),
    },
  };
};