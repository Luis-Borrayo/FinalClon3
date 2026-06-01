"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";

const actividadesBase = [];

const _actividadesDemo = [
  {
    id: "ACT-2026-001",
    nombre: "Torneo Interfacultades de Futbol Sala",
    tipo: "Deportiva",
    ubicacion: "Cancha Central, Campus Zona 3",
    mapaUrl: "",
    meetUrl: "",
    modalidad: "Presencial",
    costo: "Gratuita",
    monto: "0",
    fecha: "2026-06-10",
    horaInicio: "08:00",
    horaFin: "12:00",
    participantes: 120,
    asistentesConfirmados: 48,
    inscritos: ["asistente1@uspg.edu", "asistente2@uspg.edu"],
    creador: "Carlos Mendez (c.mendez)",
    aprobador: "Carlos Mendez",
    estado: "Aprobada",
    certificados: "Plantilla cargada",
    emiteCertificado: true,
    descripcion: "Torneo deportivo universitario por facultades.",
    observacionAprobacion: "Aprobada sin observaciones.",
  },
  {
    id: "ACT-2026-002",
    nombre: "Charla Motivacional: Liderazgo y Disciplina",
    tipo: "Motivacional",
    ubicacion: "Actividad virtual",
    mapaUrl: "",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    modalidad: "Virtual",
    costo: "Pago",
    monto: "35",
    fecha: "2026-06-14",
    horaInicio: "18:00",
    horaFin: "20:00",
    participantes: 280,
    asistentesConfirmados: 36,
    inscritos: ["asistente3@uspg.edu"],
    creador: "Carlos Mendez (c.mendez) - Rango 2",
    aprobador: "Pendiente",
    estado: "Pendiente",
    certificados: "Sin plantilla",
    emiteCertificado: false,
    descripcion: "Charla abierta para estudiantes y docentes.",
    observacionAprobacion: "",
  },
  {
    id: "ACT-2026-003",
    nombre: "Taller de Metodologia de Investigacion",
    tipo: "Educativa",
    ubicacion: "Auditorio Academico, Edificio B",
    mapaUrl: "",
    meetUrl: "",
    modalidad: "Presencial",
    costo: "Gratuita",
    monto: "0",
    fecha: "2026-06-18",
    horaInicio: "09:00",
    horaFin: "11:30",
    participantes: 65,
    asistentesConfirmados: 22,
    inscritos: [],
    creador: "Carlos Mendez (c.mendez)",
    aprobador: "Carlos Mendez",
    estado: "Aprobada",
    certificados: "Listo para emitir",
    emiteCertificado: true,
    descripcion: "Formacion academica en investigacion aplicada.",
    observacionAprobacion: "Aprobada con recomendaciones.",
  },
];

const usuarioAutenticado = {
  nombre: "Carlos Mendez",
  rol: "Creador de eventos",
  usuario: "c.mendez",
};

const cuentasAsistentesDemo = [
  { email: "alumno@uspg.edu.gt", password: "123456", nombre: "Ana Lopez", rol: "alumno" },
  { email: "evento@uspg.edu.gt", password: "123456", nombre: "Luis Perez", rol: "event-creaator" },
  { email: "admin@uspg.edu.gt", password: "admin123", nombre: "Carlos Mendez", rol: "admin-eventos" },
];

const estadoInicialFormulario = {
  nombre: "",
  fecha: "",
  horaInicio: "",
  duracionMinutos: "60",
  tipo: "Deportiva",
  modalidad: "Presencial",
  costo: "Gratuita",
  monto: "",
  ubicacion: "",
  mapaUrl: "",
  meetUrl: "",
  usarMapa: true,
  emiteCertificado: true,
  participantes: "",
  descripcion: "",
  plantillaNombre: "",
};

function badgeEstadoClass(estado) {
  if (estado === "Aprobada") return "badge-success";
  if (estado === "Pendiente") return "badge-warning";
  if (estado === "Borrador") return "badge-secondary";
  return "badge-danger";
}

function generarIdActividad(totalActual) {
  const secuencia = String(totalActual + 1).padStart(3, "0");
  return `ACT-2026-${secuencia}`;
}

function buildMapSrc(mapaUrl, ubicacion) {
  const referencia = mapaUrl?.trim() || ubicacion?.trim() || "Universidad San Pablo de Guatemala";
  return `https://www.google.com/maps?q=${encodeURIComponent(referencia)}&output=embed`;
}

function valorCosto(actividad) {
  if (actividad.costo !== "Pago") return "Gratuita";
  return `Q ${Number(actividad.monto || 0).toFixed(2)}`;
}

const duracionesEventoHoras = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];
const duracionesEventoMinutos = duracionesEventoHoras.map((horas) => horas * 60);

function formatDuracion(minutos) {
  const total = Number(minutos);
  if (!Number.isFinite(total) || total <= 0) return "";
  if (total % 60 === 0) {
    const horas = total / 60;
    return horas === 1 ? "1 hora" : `${horas} horas`;
  }
  return `${total} min`;
}

function parseHora(hora) {
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const [horas, minutos] = hora.split(":").map(Number);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return null;
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
  return horas * 60 + minutos;
}

function formatHora(totalMinutos) {
  const minutosDia = 24 * 60;
  const normalizado = ((totalMinutos % minutosDia) + minutosDia) % minutosDia;
  const horas = Math.floor(normalizado / 60);
  const minutos = normalizado % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function calcularHoraFin(horaInicio, duracionMinutos) {
  const inicioMinutos = parseHora(horaInicio);
  const duracion = Number(duracionMinutos);
  if (inicioMinutos === null || !Number.isFinite(duracion) || duracion <= 0) return "";
  return formatHora(inicioMinutos + duracion);
}

function calcularDuracionMinutos(horaInicio, horaFin) {
  const inicioMinutos = parseHora(horaInicio);
  const finMinutos = parseHora(horaFin);
  if (inicioMinutos === null || finMinutos === null) return 60;

  let diferencia = finMinutos - inicioMinutos;
  if (diferencia <= 0) diferencia += 24 * 60;
  return diferencia;
}

function segmentosHorario(horaInicio, horaFin) {
  const inicio = parseHora(horaInicio);
  const fin = parseHora(horaFin);
  if (inicio === null || fin === null) return [];

  if (inicio < fin) return [[inicio, fin]];
  if (inicio > fin) return [[inicio, 24 * 60], [0, fin]];
  return [[inicio, 24 * 60], [0, fin]];
}

function horariosSeTraslapan(horaInicioA, horaFinA, horaInicioB, horaFinB) {
  const segmentosA = segmentosHorario(horaInicioA, horaFinA);
  const segmentosB = segmentosHorario(horaInicioB, horaFinB);
  if (!segmentosA.length || !segmentosB.length) return false;

  return segmentosA.some(([inicioA, finA]) =>
    segmentosB.some(([inicioB, finB]) => inicioA < finB && inicioB < finA)
  );
}

export default function OtrasActividadesPage() {
  const [actividades, setActividades] = useState(actividadesBase);
  const [cargando, setCargando] = useState(true);
  const [formData, setFormData] = useState(estadoInicialFormulario);
  const [actividadEnEdicionId, setActividadEnEdicionId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [actividadRevision, setActividadRevision] = useState("");
  const [observacionRevision, setObservacionRevision] = useState("");
  const [mensajeDemo, setMensajeDemo] = useState("");
  const [accesoModulo, setAccesoModulo] = useState({ email: "", password: "" });
  const [sesionModulo, setSesionModulo] = useState(null);
  const [errorAccesoModulo, setErrorAccesoModulo] = useState("");
  const [adminTabActiva, setAdminTabActiva] = useState("lista");
  const [reporteFiltros, setReporteFiltros] = useState({
    estado: "Todos",
    modalidad: "Todas",
    tipo: "Todos",
    fechaDesde: "",
    fechaHasta: "",
  });
  const hoyIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  const modalidadActual = String(formData.modalidad || "").trim().toLowerCase();
  const esVirtual = modalidadActual.includes("virtual");
  const esPresencial = !esVirtual;
  const puedeRegistrarEvento = sesionModulo?.rol === "event-creaator";
  const puedeAceptarEventos = sesionModulo?.rol === "admin-eventos";
  const puedeInscribirseEvento = sesionModulo?.rol === "alumno";
  const puedeVerEstadisticas = sesionModulo?.rol !== "alumno";
  const mostrarTabsAdmin = puedeAceptarEventos;
  const mostrarBandejaAprobacion = puedeAceptarEventos && (!mostrarTabsAdmin || adminTabActiva === "bandeja");
  const mostrarReporteActividades =
    puedeVerEstadisticas && (!mostrarTabsAdmin || adminTabActiva === "reporte");
  const mostrarListadoActividades =
    puedeVerEstadisticas && (!mostrarTabsAdmin || adminTabActiva === "lista");
  const horaFinCalculada = calcularHoraFin(formData.horaInicio, formData.duracionMinutos);
  const duracionSeleccionada = String(formData.duracionMinutos || "60");
  const duracionPersonalizada =
    Number(duracionSeleccionada) > 0 &&
    !duracionesEventoMinutos.includes(Number(duracionSeleccionada));

  useEffect(() => {
    fetch("/api/otras-actividades")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setActividades(json.data);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!mensajeDemo) return undefined;

    const timerId = setTimeout(() => {
      setMensajeDemo("");
    }, 5000);

    return () => clearTimeout(timerId);
  }, [mensajeDemo]);

  const actividadesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return actividades;

    return actividades.filter((actividad) => {
      return (
        actividad.id.toLowerCase().includes(termino) ||
        actividad.nombre.toLowerCase().includes(termino) ||
        actividad.tipo.toLowerCase().includes(termino)
      );
    });
  }, [actividades, busqueda]);

  const pendientesRevision = useMemo(() => {
    return actividades.filter((actividad) => actividad.estado === "Pendiente");
  }, [actividades]);

  const actividadRevisionActual = useMemo(() => {
    if (!pendientesRevision.length) return null;

    const elegida = pendientesRevision.find((item) => item.id === actividadRevision);
    return elegida || pendientesRevision[0];
  }, [pendientesRevision, actividadRevision]);

  const metricas = useMemo(() => {
    const total = actividades.length;
    const pendientes = actividades.filter((item) => item.estado === "Pendiente").length;
    const participantes = actividades.reduce((suma, item) => suma + (Number(item.participantes) || 0), 0);
    const confirmados = actividades.reduce(
      (suma, item) => suma + (Number(item.asistentesConfirmados) || 0),
      0
    );
    const certificadosEmitibles = actividades.filter(
      (item) => item.estado === "Aprobada" && item.emiteCertificado
    ).length;

    return {
      total,
      pendientes,
      participantes,
      confirmados,
      certificadosEmitibles,
    };
  }, [actividades]);

  const tiposReporte = useMemo(() => {
    return Array.from(new Set(actividades.map((actividad) => actividad.tipo))).sort();
  }, [actividades]);

  const reporteActividades = useMemo(() => {
    return actividades
      .filter((actividad) => {
        if (reporteFiltros.estado !== "Todos" && actividad.estado !== reporteFiltros.estado) return false;
        if (reporteFiltros.modalidad !== "Todas" && actividad.modalidad !== reporteFiltros.modalidad)
          return false;
        if (reporteFiltros.tipo !== "Todos" && actividad.tipo !== reporteFiltros.tipo) return false;
        if (reporteFiltros.fechaDesde && actividad.fecha < reporteFiltros.fechaDesde) return false;
        if (reporteFiltros.fechaHasta && actividad.fecha > reporteFiltros.fechaHasta) return false;
        return true;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [actividades, reporteFiltros]);

  const resumenReporte = useMemo(() => {
    const total = reporteActividades.length;
    const aprobadas = reporteActividades.filter((item) => item.estado === "Aprobada").length;
    const pendientes = reporteActividades.filter((item) => item.estado === "Pendiente").length;
    const presenciales = reporteActividades.filter((item) => item.modalidad === "Presencial").length;
    const virtuales = reporteActividades.filter((item) => item.modalidad === "Virtual").length;
    const participantes = reporteActividades.reduce(
      (suma, item) => suma + (Number(item.participantes) || 0),
      0
    );
    const confirmados = reporteActividades.reduce(
      (suma, item) => suma + (Number(item.asistentesConfirmados) || 0),
      0
    );
    const ingresos = reporteActividades.reduce((suma, item) => {
      if (item.costo !== "Pago") return suma;
      return suma + (Number(item.monto) || 0);
    }, 0);

    return {
      total,
      aprobadas,
      pendientes,
      presenciales,
      virtuales,
      participantes,
      confirmados,
      ingresos,
    };
  }, [reporteActividades]);

  const eventosInscripcion = useMemo(() => {
    return actividades.filter((actividad) => actividad.estado === "Aprobada");
  }, [actividades]);

  const mapSrc = buildMapSrc(formData.mapaUrl, formData.ubicacion);

  function handleModalidadChange(event) {
    const modalidadRaw = String(event.target.value || "").trim().toLowerCase();
    const modalidad = modalidadRaw.includes("virtual") ? "Virtual" : "Presencial";

    setFormData((prev) => {
      if (modalidad === "Virtual") {
        return {
          ...prev,
          modalidad,
          usarMapa: false,
          ubicacion: "",
          mapaUrl: "",
        };
      }

      return {
        ...prev,
        modalidad,
        usarMapa: true,
        meetUrl: "",
      };
    });
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: newValue,
      };

      if (name === "costo" && value === "Gratuita") {
        next.monto = "";
      }

      return next;
    });
  }

  function handlePlantillaChange(event) {
    const file = event.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      plantillaNombre: file ? file.name : "",
    }));
  }

  function limpiarFormulario() {
    setFormData(estadoInicialFormulario);
    setActividadEnEdicionId("");
  }

  function cargarActividadEnFormulario(actividad) {
    const modalidadNormalizada =
      String(actividad.modalidad || "").trim().toLowerCase().includes("virtual")
        ? "Virtual"
        : "Presencial";
    const esActividadVirtual = modalidadNormalizada === "Virtual";

    setFormData({
      nombre: actividad.nombre || "",
      fecha: actividad.fecha || "",
      horaInicio: actividad.horaInicio || "",
      duracionMinutos: String(calcularDuracionMinutos(actividad.horaInicio, actividad.horaFin)),
      tipo: actividad.tipo || "Deportiva",
      modalidad: modalidadNormalizada,
      costo: actividad.costo || "Gratuita",
      monto: actividad.costo === "Pago" ? String(actividad.monto || "") : "",
      ubicacion: esActividadVirtual || actividad.ubicacion === "Actividad virtual" ? "" : actividad.ubicacion || "",
      mapaUrl: esActividadVirtual ? "" : actividad.mapaUrl || "",
      meetUrl: esActividadVirtual ? actividad.meetUrl || "" : "",
      usarMapa: !esActividadVirtual,
      emiteCertificado: Boolean(actividad.emiteCertificado),
      participantes: String(actividad.participantes ?? ""),
      descripcion: actividad.descripcion || "",
      plantillaNombre: "",
    });
  }

  function editarActividadBorrador(actividadId) {
    const actividad = actividades.find((item) => item.id === actividadId && item.estado === "Borrador");
    if (!actividad) {
      setMensajeDemo("Solo puedes editar actividades en estado borrador.");
      return;
    }

    setActividadEnEdicionId(actividad.id);
    cargarActividadEnFormulario(actividad);
    setMensajeDemo(`Editando borrador ${actividad.id}.`);
  }

  function enviarBorradorARevision(actividadId) {
    fetch(`/api/otras-actividades/${actividadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "enviar_revision" }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setActividades((prev) =>
            prev.map((a) => (a.id === actividadId ? json.data : a))
          );
          if (actividadEnEdicionId === actividadId) limpiarFormulario();
          setMensajeDemo(`Actividad ${actividadId} enviada a aprobacion.`);
        } else {
          setMensajeDemo(json.message || "Error al enviar a revision.");
        }
      })
      .catch(() => setMensajeDemo("Error de conexion al enviar a revision."));
  }

  function handleAccesoModuloChange(event) {
    const { name, value } = event.target;
    setAccesoModulo((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function iniciarSesionModulo(event) {
    event.preventDefault();
    setErrorAccesoModulo("");

    const email = accesoModulo.email.trim().toLowerCase();
    const password = accesoModulo.password;

    const cuenta = cuentasAsistentesDemo.find(
      (item) => item.email.toLowerCase() === email && item.password === password
    );

    if (!cuenta) {
      setErrorAccesoModulo("Credenciales invalidas. Verifica correo y contrasena.");
      return;
    }

    setSesionModulo({
      email: cuenta.email,
      nombre: cuenta.nombre,
      rol: cuenta.rol,
    });
    setAccesoModulo({ email: "", password: "" });
    setMensajeDemo(`Sesion iniciada (${cuenta.rol}).`);
  }

  function cerrarSesionModulo() {
    setSesionModulo(null);
    setErrorAccesoModulo("");
    setMensajeDemo("Sesion finalizada.");
  }

  function inscribirseEnEvento(eventoId) {
    if (!sesionModulo) {
      setMensajeDemo("Debes iniciar sesion con correo y contrasena para inscribirte.");
      return;
    }

    const eventoObjetivo = actividades.find((actividad) => actividad.id === eventoId);
    if (!eventoObjetivo) {
      setMensajeDemo("No se encontro el evento seleccionado.");
      return;
    }

    const conflictoHorario = actividades.find((actividad) => {
      if (actividad.id === eventoId) return false;
      if (actividad.fecha !== eventoObjetivo.fecha) return false;

      const inscritosActuales = Array.isArray(actividad.inscritos) ? actividad.inscritos : [];
      if (!inscritosActuales.includes(sesionModulo.email)) return false;

      return horariosSeTraslapan(
        eventoObjetivo.horaInicio,
        eventoObjetivo.horaFin,
        actividad.horaInicio,
        actividad.horaFin
      );
    });

    if (conflictoHorario) {
      setMensajeDemo(
        `No puedes inscribirte en ${eventoObjetivo.id} porque se traslapa con ${conflictoHorario.id}.`
      );
      return;
    }

    fetch(`/api/otras-actividades/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "inscribir", email: sesionModulo.email }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setActividades((prev) =>
            prev.map((a) => (a.id === eventoId ? json.data : a))
          );
          setMensajeDemo(`Inscripcion confirmada para el evento ${eventoId}.`);
        } else {
          setMensajeDemo(json.message || "Error al inscribirse.");
        }
      })
      .catch(() => setMensajeDemo("Error de conexion al inscribirse."));
  }

  function crearActividad(estadoObjetivo) {
    if (!formData.nombre.trim() || !formData.fecha || !formData.horaInicio) {
      setMensajeDemo("Completa nombre de actividad, fecha del evento y hora de inicio.");
      return;
    }

    const duracionMinutos = Number(formData.duracionMinutos);
    if (!Number.isFinite(duracionMinutos) || duracionMinutos <= 0) {
      setMensajeDemo("Selecciona una duracion valida para el evento.");
      return;
    }

    const horaFinEvento = calcularHoraFin(formData.horaInicio, duracionMinutos);
    if (!horaFinEvento) {
      setMensajeDemo("No se pudo calcular la hora de finalizacion del evento.");
      return;
    }

    if (formData.fecha < hoyIso) {
      setMensajeDemo("La fecha del evento no puede ser menor a la fecha actual.");
      return;
    }

    if (esPresencial && !formData.ubicacion.trim()) {
      setMensajeDemo("Si la actividad es presencial, debes ingresar la direccion.");
      return;
    }

    if (esVirtual) {
      if (!formData.meetUrl.trim()) {
        setMensajeDemo("Si la actividad es virtual, debes ingresar la URL del Meet.");
        return;
      }

      if (!/^https?:\/\//i.test(formData.meetUrl.trim())) {
        setMensajeDemo("La URL del Meet debe iniciar con http:// o https://.");
        return;
      }

      try {
        const meetHost = new URL(formData.meetUrl.trim()).hostname.toLowerCase();
        if (meetHost !== "meet.google.com") {
          setMensajeDemo("La URL virtual debe pertenecer a meet.google.com.");
          return;
        }
      } catch {
        setMensajeDemo("La URL del Meet no es valida.");
        return;
      }
    }

    const actividadExistente = actividadEnEdicionId
      ? actividades.find((item) => item.id === actividadEnEdicionId)
      : null;

    const creadorStr = sesionModulo
      ? `${sesionModulo.nombre} (${sesionModulo.email}) - ${sesionModulo.rol}`
      : `${usuarioAutenticado.nombre} (${usuarioAutenticado.usuario}) - ${usuarioAutenticado.rol}`;

    const payload = {
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      ubicacion: esPresencial ? formData.ubicacion.trim() : "Actividad virtual",
      mapaUrl: esPresencial ? formData.mapaUrl.trim() : "",
      meetUrl: esVirtual ? formData.meetUrl.trim() : "",
      modalidad: formData.modalidad,
      costo: formData.costo,
      monto: formData.costo === "Pago" ? formData.monto || "0" : "0",
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFin: horaFinEvento,
      participantes: Number(formData.participantes) || 0,
      creador: creadorStr,
      estado: estadoObjetivo,
      certificados: formData.emiteCertificado
        ? formData.plantillaNombre
          ? "Plantilla cargada"
          : "Pendiente plantilla"
        : "No aplica",
      emiteCertificado: formData.emiteCertificado,
      descripcion: formData.descripcion.trim(),
    };

    if (actividadExistente) {
      fetch(`/api/otras-actividades/${actividadExistente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "editar", ...payload }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setActividades((prev) =>
              prev.map((a) => (a.id === actividadExistente.id ? json.data : a))
            );
            setMensajeDemo(`Actividad ${json.data.id} actualizada${estadoObjetivo === "Pendiente" ? " y enviada a aprobacion" : " como borrador"}.`);
          } else {
            setMensajeDemo(json.message || "Error al actualizar actividad.");
          }
        })
        .catch(() => setMensajeDemo("Error de conexion al actualizar actividad."));
    } else {
      fetch("/api/otras-actividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setActividades((prev) => [json.data, ...prev]);
            setMensajeDemo(
              estadoObjetivo === "Pendiente"
                ? `Actividad ${json.data.id} enviada a aprobacion.`
                : `Actividad ${json.data.id} guardada como borrador.`
            );
          } else {
            setMensajeDemo(json.message || "Error al crear actividad.");
          }
        })
        .catch(() => setMensajeDemo("Error de conexion al crear actividad."));
    }

    limpiarFormulario();
  }

  function resolverRevision(nuevoEstado) {
    if (!actividadRevisionActual) {
      setMensajeDemo("No hay actividades pendientes de revision.");
      return;
    }

    const idObjetivo = actividadRevisionActual.id;
    const aprobadorNombre = sesionModulo?.nombre || "Carlos Mendez";

    fetch(`/api/otras-actividades/${idObjetivo}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "resolver",
        estado: nuevoEstado,
        aprobador: aprobadorNombre,
        observacion: observacionRevision.trim(),
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setActividades((prev) =>
            prev.map((a) => (a.id === idObjetivo ? json.data : a))
          );
          setMensajeDemo(`Actividad ${idObjetivo} ${nuevoEstado.toLowerCase()} por ${aprobadorNombre}.`);
        } else {
          setMensajeDemo(json.message || "Error al resolver revision.");
        }
      })
      .catch(() => setMensajeDemo("Error de conexion al resolver revision."));

    setObservacionRevision("");
    setActividadRevision("");
  }

  function handleReporteFiltroChange(event) {
    const { name, value } = event.target;
    setReporteFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function exportarExcelReporte() {
    if (!reporteActividades.length) {
      setMensajeDemo("No hay datos en el reporte para exportar a Excel.");
      return;
    }

    const data = reporteActividades.map((actividad) => ({
      Codigo: actividad.id,
      Actividad: actividad.nombre,
      Tipo: actividad.tipo,
      Modalidad: actividad.modalidad,
      Fecha: actividad.fecha,
      HoraInicio: actividad.horaInicio || "-",
      HoraFinal: actividad.horaFin || "-",
      Participantes: actividad.participantes,
      Confirmados: Number(actividad.asistentesConfirmados) || 0,
      Costo: valorCosto(actividad),
      Ubicacion: actividad.ubicacion,
      MeetURL: actividad.meetUrl || "-",
      Creador: actividad.creador,
      Aprobador: actividad.aprobador,
      Estado: actividad.estado,
      EmitirCertificado: actividad.emiteCertificado ? "Si" : "No",
      Certificados: actividad.certificados,
      Descripcion: actividad.descripcion || "",
      ObservacionAprobacion: actividad.observacionAprobacion || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Actividades");
    XLSX.writeFile(workbook, `reporte_actividades_${hoyIso}.xlsx`);
    setMensajeDemo("Reporte Excel exportado correctamente.");
  }

  function exportarPdfReporte() {
    if (!reporteActividades.length) {
      setMensajeDemo("No hay datos en el reporte para exportar a PDF.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Reporte Detallado de Actividades", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generado: ${hoyIso}`, 40, 58);

    autoTable(doc, {
      startY: 72,
      head: [["Codigo", "Actividad", "Tipo", "Modalidad", "Fecha", "Inicio", "Final", "Particip.", "Confirm.", "Costo", "Estado"]],
      body: reporteActividades.map((actividad) => [
        actividad.id,
        actividad.nombre,
        actividad.tipo,
        actividad.modalidad,
        actividad.fecha,
        actividad.horaInicio || "-",
        actividad.horaFin || "-",
        String(actividad.participantes ?? 0),
        String(actividad.asistentesConfirmados ?? 0),
        valorCosto(actividad),
        actividad.estado,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [128, 0, 32] },
    });

    doc.save(`reporte_actividades_${hoyIso}.pdf`);
    setMensajeDemo("Reporte PDF exportado correctamente.");
  }

  return (
    <div className="row clearfix otras-actividades-page">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <h3 className="card-title mb-1">Gestion de Otras Actividades</h3>
              <small className="text-muted">
                Registro, aprobacion y visualizacion de actividades.
              </small>
            </div>
           {/* {sesionModulo ? ( <div className="mt-2 mt-md-0">
              <span className="badge badge-info mr-2">Crea: Eventos</span>
              <span className="badge badge-secondary">Aprueba: {sesionModulo.nombre}</span>
            </div> ): null} */}
          </div>
            
          <div className="card-body">
            {mensajeDemo ? (
              <div
                className="alert alert-warning shadow"
                role="alert"
                style={{
                  position: "fixed",
                  top: "16px",
                  right: "16px",
                  zIndex: 1050,
                  minWidth: "280px",
                  maxWidth: "420px",
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <span className="pr-2">{mensajeDemo}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setMensajeDemo("")}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : null}

            {!sesionModulo ? (
              
              <div className="card mb-0 col-6 m-auto">
                <div className="card-header">
                  <h5 className="mb-0">Acceso al modulo de eventos</h5>
                </div>
                
                <div className="card-body">
                  <form onSubmit={iniciarSesionModulo}>
                    <div className="form-row">
                      <div className="form-group col-md-12">
                        <label htmlFor="moduloEmail">Correo</label>
                        <input
                          id="moduloEmail"
                          name="email"
                          type="email"
                          className="form-control"
                          placeholder="usuario@uspg.edu"
                          value={accesoModulo.email}
                          onChange={handleAccesoModuloChange}
                        />
                      </div>
                      <div className="form-group col-md-12">
                        <label htmlFor="moduloPassword">Contrasena</label>
                        <input
                          id="moduloPassword"
                          name="password"
                          type="password"
                          className="form-control"
                          placeholder="******"
                          value={accesoModulo.password}
                          onChange={handleAccesoModuloChange}
                        />
                      </div>
                      <div className="form-group col-md-4 d-flex align-items-end">
                        <button type="submit" className="w-full h-14 text-lg font-semibold bg-[#800020] hover:bg-[#600018] text-white rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
                          Iniciar sesion
                        </button>
                      </div>
                    </div>
                    <small className="text-muted d-block mb-2">
                      Usuarios demo: <br /> alumno@uspg.edu.gt  / 123456 <br /> evento@uspg.edu.gt / 123456 <br /> admin@uspg.edu.gt / admin123
                    </small>
                    {errorAccesoModulo ? <div className="text-danger">{errorAccesoModulo}</div> : null}
                  </form>
                </div>
              </div>
            ) : (
              <>
              
                <div className="d-flex justify-content-between align-items-center flex-wrap mb-3 p-2 border rounded">
                  <div>
                    <span className=" mr-2">Bienvenid@,</span>
                    <strong>{sesionModulo.nombre}</strong> 
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cerrarSesionModulo}>
                    Cerrar sesion
                  </button>
                </div>
                {puedeVerEstadisticas ? (
            <div className="row mb-4">
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="border bg-warning rounded p-3 h-100">
                  <p className="mb-1 text-white">Total actividades</p>
                  <h4 className="mb-0 text-white font-bold">{metricas.total}</h4>
                </div>
              </div>
              <div className="col-md-3  col-sm-6 mb-3">
                <div className="border bg-danger rounded p-3 h-100">
                  <p className="mb-1 text-white">Pendientes de aprobar</p>
                  <h4 className="mb-0 text-white">{metricas.pendientes}</h4>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="border bg-primary rounded p-3 h-100">
                  <p className="mb-1  text-white">Participantes proyectados</p>
                  <h4 className="mb-0 text-white">{metricas.participantes.toLocaleString()}</h4>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="border bg-success rounded p-3 h-100">
                  <p className="mb-1 text-white">Asistentes confirmados</p>
                  <h4 className="mb-0 text-white">{metricas.confirmados.toLocaleString()}</h4>
                </div>
              </div>
            </div>
            ) : null}
                {mostrarTabsAdmin ? (
                  <ul className="nav nav-tabs mb-3" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        type="button"
                        className={`nav-link p-2 ${adminTabActiva === "lista" ? "active" : ""}`}
                        onClick={() => setAdminTabActiva("lista")}
                      >
                        Lista de actividades
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        type="button"
                        className={`nav-link p-2 ${adminTabActiva === "reporte" ? "active" : ""}`}
                        onClick={() => setAdminTabActiva("reporte")}
                      >
                        Reporte de actividades
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        type="button"
                        className={`nav-link p-2 ${adminTabActiva === "bandeja" ? "active" : ""}`}
                        onClick={() => setAdminTabActiva("bandeja")}
                      >
                        Bandeja de aprobacion
                        {pendientesRevision.length > 0 ? (
                          <span className="badge badge-danger ml-2">{pendientesRevision.length}</span>
                        ) : null}
                      </button>
                    </li>
                  </ul>
                ) : null}

            

            <div className="row">
              {puedeRegistrarEvento ? (
              <div className={puedeAceptarEventos ? "col-lg-8 mb-4" : "col-lg-12 mb-4"}>
                <div className="card mb-0">
                  <div className="card-header">
                    <h5 className="mb-0">
                      {actividadEnEdicionId
                        ? `Editar actividad ${actividadEnEdicionId} `
                        : "Crear actividad"}
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={(event) => event.preventDefault()}>
                      <div className="form-row">
                        <div className="form-group col-md-7">
                          <label htmlFor="actividadNombre">Nombre de la actividad</label>
                          <input
                            id="actividadNombre"
                            name="nombre"
                            type="text"
                            className="form-control"
                            placeholder="Ej: Jornada deportiva universitaria"
                            value={formData.nombre}
                            onChange={handleChange}
                          />
                        </div>
                         <div className="form-group col-md-5">
                          <label htmlFor="actividadParticipantes">Cantidad de participantes</label>
                          <input
                            id="actividadParticipantes"
                            name="participantes"
                            type="number"
                            className="form-control"
                            min="1"
                            placeholder="0"
                            value={formData.participantes}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-group col-md-3">
                          <label htmlFor="actividadFecha">Fecha del evento</label>
                          <input
                            id="actividadFecha"
                            name="fecha"
                            type="date"
                            className="form-control"
                            min={hoyIso}
                            value={formData.fecha}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-group col-md-3">
                          <label htmlFor="actividadHoraInicio">Hora de inicio</label>
                          <input
                            id="actividadHoraInicio"
                            name="horaInicio"
                            type="time"
                            className="form-control"
                            value={formData.horaInicio}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-group col-md-3">
                          <label htmlFor="actividadDuracion">Duracion del evento (horas)</label>
                          <select
                            id="actividadDuracion"
                            name="duracionMinutos"
                            className="form-control"
                            value={duracionSeleccionada}
                            onChange={handleChange}
                          >
                            {duracionesEventoHoras.map((horas) => (
                              <option key={horas} value={String(horas * 60)}>
                                {horas === 1 ? "1 hora" : `${horas} horas`}
                              </option>
                            ))}
                            {duracionPersonalizada ? (
                              <option value={duracionSeleccionada}>{formatDuracion(duracionSeleccionada)}</option>
                            ) : null}
                          </select>
                        </div>
                        <div className="form-group col-md-3">
                          <label htmlFor="actividadHoraFinCalculada">Hora de finalizacion (calculada)</label>
                          <input
                            id="actividadHoraFinCalculada"
                            type="time"
                            className="form-control"
                            value={horaFinCalculada}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label htmlFor="actividadTipo">Tipo actividad</label>
                          <select
                            id="actividadTipo"
                            name="tipo"
                            className="form-control"
                            value={formData.tipo}
                            onChange={handleChange}
                          >
                            <option>Deportiva</option>
                            <option>Educativa</option>
                            <option>Charla</option>
                            <option>Motivacional</option>
                          </select>
                        </div>
                        <div className="form-group col-md-6">
                          <label htmlFor="actividadModalidad">Modalidad</label>
                          <select
                            id="actividadModalidad"
                            name="modalidad"
                            className="form-control"
                            value={formData.modalidad}
                            onChange={handleModalidadChange}
                          >
                            <option value="Presencial">Presencial</option>
                            <option value="Virtual">Virtual</option>
                          </select>
                        </div>
                       
                      </div>

                      <div>
                      {esPresencial && (
                        <>
                          <div className="form-row">
                            <div className="form-group col-md-12">
                              <label htmlFor="actividadUbicacion">Direccion</label>
                              <input
                                id="actividadUbicacion"
                                name="ubicacion"
                                type="text"
                                className="form-control"
                                placeholder="Ej: Auditorio principal, Campus Central"
                                value={formData.ubicacion}
                                onChange={handleChange}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                      
                            <div className="border rounded p-2">
                              <iframe
                                title="Vista previa de mapa"
                                src={mapSrc}
                                style={{ width: "100%", height: "220px", border: 0 }}
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      {esVirtual && (
                        <div className="form-row">
                          <div className="form-group col-md-12">
                            <label htmlFor="actividadMeetUrl">URL del Meet</label>
                            <input
                              id="actividadMeetUrl"
                              name="meetUrl"
                              type="url"
                              className="form-control"
                              placeholder="https://meet.google.com/xxx-xxxx-xxx"
                              value={formData.meetUrl}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      )}
                      </div>

                      <div className="form-row">
                        
                         <div className="form-group col-md-4">
                          <label htmlFor="actividadCosto">Costo</label>
                          <select
                            id="actividadCosto"
                            name="costo"
                            className="form-control"
                            value={formData.costo}
                            onChange={handleChange}
                          >
                            <option>Gratuita</option>
                            <option>Pago</option>
                          </select>
                        </div>
                        <div className="form-group col-md-4">
                          <label htmlFor="actividadMonto">Monto (si es de pago)</label>
                          <input
                            id="actividadMonto"
                            name="monto"
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            disabled={formData.costo !== "Pago"}
                            value={formData.monto}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="form-group col-md-4 d-flex align-items-end">
                          <div className="form-check mb-2">
                            <input
                              id="emitirCertificado"
                              name="emiteCertificado"
                              type="checkbox"
                              className="form-check-input"
                              checked={formData.emiteCertificado}
                              onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="emitirCertificado">
                              Emitir certificado
                            </label>
                          </div>
                        </div>
                      
                      <div className="form-row">
                        <div className="form-group col-md-6">
                          <label htmlFor="actividadResponsable">Responsable creador</label>
                          <input
                            id="actividadResponsable"
                            type="text"
                            className="form-control"
                            value={`${usuarioAutenticado.nombre} (${usuarioAutenticado.usuario}) - ${usuarioAutenticado.rol}`}
                            readOnly
                          />
                        </div>
                       
                      </div>

                      <div className="form-group">
                        <label htmlFor="actividadDescripcion">Descripcion del evento</label>
                        <textarea
                          id="actividadDescripcion"
                          name="descripcion"
                          className="form-control"
                          rows="3"
                          placeholder="Objetivo, alcance y detalles importantes de la actividad..."
                          value={formData.descripcion}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="d-flex flex-wrap">
                        <button
                          type="button"
                          className="btn btn-primary mr-2 mb-2"
                          onClick={() => crearActividad("Borrador")}
                        >
                          {actividadEnEdicionId ? "Guardar cambios" : "Guardar borrador"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-success mr-2 mb-2"
                          onClick={() => crearActividad("Pendiente")}
                        >
                          Enviar a aprobacion
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary mb-2"
                          onClick={limpiarFormulario}
                        >
                          {actividadEnEdicionId ? "Cancelar edicion" : "Limpiar formulario"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              ) : null}

              {mostrarBandejaAprobacion ? (
              <div className={puedeRegistrarEvento ? "col-lg-4 mb-4" : "col-lg-12 mb-4"}>
                <div className="card mb-3">
                  <div className="card-header">
                    <h5 className="mb-0">Flujo de aprobacion</h5>
                  </div>
                  <div className="card-body">
                    <ol className="pl-3 mb-0">
                      <li className="mb-2">Rango 2 crea la actividad y adjunta la plantilla de certificado.</li>
                      <li className="mb-2">La solicitud pasa a bandeja de revision.</li>
                      <li className="mb-2">Rango Q aprueba o rechaza con observaciones.</li>
                      <li>Al aprobarse, se habilita la emision de certificados.</li>
                    </ol>
                  </div>
                </div>

                <div className="card mb-0">
                  <div className="card-header">
                    <h5 className="mb-0">
                      Bandeja de aprobacion
                      {pendientesRevision.length > 0 ? (
                        <span className="badge badge-danger ml-2">{pendientesRevision.length}</span>
                      ) : null}
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label htmlFor="actividadRevision">Actividad en revision</label>
                      <select
                        id="actividadRevision"
                        className="form-control"
                        value={actividadRevisionActual ? actividadRevisionActual.id : ""}
                        onChange={(event) => setActividadRevision(event.target.value)}
                        disabled={!pendientesRevision.length}
                      >
                        {pendientesRevision.length ? (
                          pendientesRevision.map((actividad) => (
                            <option key={actividad.id} value={actividad.id}>
                              {actividad.id} - {actividad.nombre}
                            </option>
                          ))
                        ) : (
                          <option value="">Sin actividades pendientes</option>
                        )}
                      </select>
                    </div>

                    {actividadRevisionActual ? (
                      <div className="border rounded p-3 mb-3 bg-light">
                        <h6 className="mb-3">Detalle completo del evento a aprobar</h6>
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Codigo</small>
                            <strong>{actividadRevisionActual.id}</strong>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Estado actual</small>
                            <span className={`badge ${badgeEstadoClass(actividadRevisionActual.estado)}`}>
                              {actividadRevisionActual.estado}
                            </span>
                          </div>
                          <div className="col-md-12 mb-2">
                            <small className="text-muted d-block">Nombre</small>
                            <strong>{actividadRevisionActual.nombre}</strong>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Tipo</small>
                            <span>{actividadRevisionActual.tipo}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Modalidad</small>
                            <span>{actividadRevisionActual.modalidad}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Fecha</small>
                            <span>{actividadRevisionActual.fecha}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Horario</small>
                            <span>
                              {actividadRevisionActual.horaInicio || "-"} - {actividadRevisionActual.horaFin || "-"}
                              {actividadRevisionActual.horaInicio && actividadRevisionActual.horaFin ? (
                                <> ({formatDuracion(calcularDuracionMinutos(actividadRevisionActual.horaInicio, actividadRevisionActual.horaFin))})</>
                              ) : null}
                            </span>
                          </div>
                          <div className="col-md-12 mb-2">
                            <small className="text-muted d-block">
                              {actividadRevisionActual.modalidad === "Virtual" ? "Enlace virtual" : "Ubicacion"}
                            </small>
                            {actividadRevisionActual.modalidad === "Virtual" && actividadRevisionActual.meetUrl ? (
                              <a href={actividadRevisionActual.meetUrl} target="_blank" rel="noreferrer">
                                {actividadRevisionActual.meetUrl}
                              </a>
                            ) : (
                              <span>{actividadRevisionActual.ubicacion || "-"}</span>
                            )}
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Costo</small>
                            <span>{valorCosto(actividadRevisionActual)}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Participantes / Confirmados</small>
                            <span>
                              {Number(actividadRevisionActual.participantes) || 0} / {Number(actividadRevisionActual.asistentesConfirmados) || 0}
                            </span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Creador</small>
                            <span>{actividadRevisionActual.creador || "-"}</span>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted d-block">Certificados</small>
                            <span>{actividadRevisionActual.certificados || "-"}</span>
                          </div>
                          <div className="col-md-12 mb-0">
                            <small className="text-muted d-block">Descripcion</small>
                            <span>{actividadRevisionActual.descripcion || "Sin descripcion"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-light border" role="alert">
                        No hay actividad seleccionada para revisar.
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="observacion">Observacion de aprobacion</label>
                      <textarea
                        id="observacion"
                        rows="3"
                        className="form-control"
                        placeholder="Comentario para aprobar o rechazar la actividad"
                        value={observacionRevision}
                        onChange={(event) => setObservacionRevision(event.target.value)}
                      />
                    </div>
                    <div className="d-flex flex-wrap">
                      <button
                        type="button"
                        className="btn btn-success mr-2 mb-2"
                        disabled={!actividadRevisionActual}
                        onClick={() => resolverRevision("Aprobada")}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger mb-2"
                        disabled={!actividadRevisionActual}
                        onClick={() => resolverRevision("Rechazada")}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ) : null}
            </div>

            {puedeInscribirseEvento ? (
            <div className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-0">Portal de inscripcion de asistentes</h5>
              </div>
              <div className="card-body">
                <div className="mb-3 text-muted">
                  {/* Sesion activa: <strong>{sesionModulo.nombre}</strong>.  */} Eventos disponibles
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Evento</th>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Cupos</th>
                        <th>Precio</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventosInscripcion.map((evento) => {
                        const confirmados = Number(evento.asistentesConfirmados) || 0;
                        const capacidad = Number(evento.participantes) || 0;
                        const montoEvento = Number(evento.monto) || 0;
                        const precioTexto = montoEvento > 0 ? `Q ${montoEvento.toFixed(2)}` : "Gratuito";
                        const yaInscrito =
                          sesionModulo &&
                          Array.isArray(evento.inscritos) &&
                          evento.inscritos.includes(sesionModulo.email);
                        const sinCupo = capacidad > 0 && confirmados >= capacidad;

                        return (
                          <tr key={`inscripcion-${evento.id}`}>
                            <td>{evento.id}</td>
                            <td>{evento.nombre}</td>
                            <td>{evento.fecha}</td>
                            <td>
                              {evento.horaInicio} - {evento.horaFin}
                            </td>
                            <td>{capacidad}</td>
                            <td>{precioTexto}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                disabled={!sesionModulo || yaInscrito || sinCupo}
                                onClick={() => inscribirseEnEvento(evento.id)}
                              >
                                {yaInscrito ? "Inscrito" : sinCupo ? "Sin cupo" : "Inscribirme"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!eventosInscripcion.length ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-3">
                            No hay eventos aprobados disponibles para inscripcion.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            ) : null}

            {mostrarReporteActividades ? (
            <div className="card mb-0">
              <div className="card-header">
                <h5 className="mb-0">Reporte detallado de actividades</h5>
              </div>
              
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-2 col-6 mb-2">
                    <div className="border bg-light rounded p-2 h-100">
                      <small className="text-muted d-block">Total</small>
                      <strong>{resumenReporte.total}</strong>
                    </div>
                  </div>
                  <div className="col-md-2 col-6 mb-2">
                    <div className="border bg-light rounded p-2 h-100">
                      <small className="text-muted d-block">Aprobadas</small>
                      <strong>{resumenReporte.aprobadas}</strong>
                    </div>
                  </div>
                  <div className="col-md-2 col-6 mb-2">
                    <div className="border bg-light rounded p-2 h-100">
                      <small className="text-muted d-block">Pendientes</small>
                      <strong>{resumenReporte.pendientes}</strong>
                    </div>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <div className="border bg-light rounded p-2 h-100">
                      <small className="text-muted d-block">Presenciales</small>
                      <strong>{resumenReporte.presenciales}</strong>
                    </div>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <div className="border bg-light rounded p-2 h-100">
                      <small className="text-muted d-block">Virtuales</small>
                      <strong>{resumenReporte.virtuales}</strong>
                    </div>
                  </div>
                  <div className="col-md-6 col-6 mb-2">
                    <div className="border rounded p-2 h-100">
                      <small className="text-muted d-block">Ingresos</small>
                      <strong>Q {resumenReporte.ingresos.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="col-md-62 col-6 mb-2">
                    <div className="border rounded p-2 h-100">
                      <small className="text-muted d-block">Confirmados</small>
                      <strong>{resumenReporte.confirmados}</strong>
                    </div>
                  </div>
                </div>
                <div className="form-row align-items-end">
                  <div className="form-group col-md-2">
                    <label htmlFor="reporteEstado">Estado</label>
                    <select
                      id="reporteEstado"
                      name="estado"
                      className="form-control"
                      value={reporteFiltros.estado}
                      onChange={handleReporteFiltroChange}
                    >
                      <option>Todos</option>
                      <option>Aprobada</option>
                      <option>Pendiente</option>
                      <option>Rechazada</option>
                      <option>Borrador</option>
                    </select>
                  </div>
                  <div className="form-group col-md-2">
                    <label htmlFor="reporteModalidad">Modalidad</label>
                    <select
                      id="reporteModalidad"
                      name="modalidad"
                      className="form-control"
                      value={reporteFiltros.modalidad}
                      onChange={handleReporteFiltroChange}
                    >
                      <option>Todas</option>
                      <option>Presencial</option>
                      <option>Virtual</option>
                    </select>
                  </div>
                  <div className="form-group col-md-2">
                    <label htmlFor="reporteTipo">Tipo</label>
                    <select
                      id="reporteTipo"
                      name="tipo"
                      className="form-control"
                      value={reporteFiltros.tipo}
                      onChange={handleReporteFiltroChange}
                    >
                      <option>Todos</option>
                      {tiposReporte.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group col-md-2">
                    <label htmlFor="reporteFechaDesde">Fecha desde</label>
                    <input
                      id="reporteFechaDesde"
                      name="fechaDesde"
                      type="date"
                      className="form-control"
                      value={reporteFiltros.fechaDesde}
                      onChange={handleReporteFiltroChange}
                    />
                  </div>
                  <div className="form-group col-md-2">
                    <label htmlFor="reporteFechaHasta">Fecha hasta</label>
                    <input
                      id="reporteFechaHasta"
                      name="fechaHasta"
                      type="date"
                      className="form-control"
                      value={reporteFiltros.fechaHasta}
                      onChange={handleReporteFiltroChange}
                    />
                  </div>
                  <div className="form-group col-md-2 d-flex">
                    <button type="button" className="btn btn-outline-success mr-2" onClick={exportarExcelReporte}>
                      Excel
                    </button>
                    <button type="button" className="btn btn-outline-danger" onClick={exportarPdfReporte}>
                      PDF
                    </button>
                  </div>
                </div>

                

                <div className="table-responsive">
                  <table className="table table-sm table-striped mb-0">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Actividad</th>
                        <th>Tipo</th>
                        <th>Modalidad</th>
                        <th>Fecha</th>
                        <th>Inicio</th>
                        <th>Final</th>
                        <th>Participantes</th>
                        <th>Confirmados</th>
                        <th>Costo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteActividades.map((actividad) => (
                        <tr key={`reporte-${actividad.id}`}>
                          <td>{actividad.id}</td>
                          <td>{actividad.nombre}</td>
                          <td>{actividad.tipo}</td>
                          <td>{actividad.modalidad}</td>
                          <td>{actividad.fecha}</td>
                          <td>{actividad.horaInicio || "-"}</td>
                          <td>{actividad.horaFin || "-"}</td>
                          <td>{actividad.participantes}</td>
                          <td>{actividad.asistentesConfirmados || 0}</td>
                          <td>{valorCosto(actividad)}</td>
                          <td>{actividad.estado}</td>
                        </tr>
                      ))}
                      {!reporteActividades.length ? (
                        <tr>
                          <td colSpan="11" className="text-center text-muted py-3">
                            No hay datos para el reporte con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            ) : null}

            {mostrarListadoActividades ? (
            <div className="card mb-0 mt-3">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-0">Listado de actividades</h5>
                <div className="mt-2 mt-md-0">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por codigo, nombre o tipo"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Actividad</th>
                        <th>Modalidad</th>
                        <th>Costo</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividadesFiltradas.map((actividad) => (
                        <tr key={actividad.id}>
                          <td>{actividad.id}</td>
                          <td>{actividad.nombre}</td>
                          <td>{actividad.modalidad}</td>
                          <td>{valorCosto(actividad)}</td>
                          <td>{actividad.fecha}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setActividadDetalle(actividad)}
                            >
                              Ver actividad
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!actividadesFiltradas.length ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">
                            No hay actividades que coincidan con la busqueda.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            ) : null}

            {actividadDetalle ? (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.45)",
                  zIndex: 1060,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px",
                }}
                onClick={() => setActividadDetalle(null)}
              >
                <div
                  className="card mb-0"
                  style={{ width: "100%", maxWidth: "820px", maxHeight: "90vh", overflowY: "auto" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Detalle completo de actividad</h5>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setActividadDetalle(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Codigo</small>
                        <strong>{actividadDetalle.id}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Estado</small>
                        <span className={`badge ${badgeEstadoClass(actividadDetalle.estado)}`}>
                          {actividadDetalle.estado}
                        </span>
                      </div>
                      <div className="col-md-12 mb-2">
                        <small className="text-muted d-block">Actividad</small>
                        <strong>{actividadDetalle.nombre}</strong>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Tipo</small>
                        <span>{actividadDetalle.tipo}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Modalidad</small>
                        <span>{actividadDetalle.modalidad}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Fecha</small>
                        <span>{actividadDetalle.fecha}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Horario</small>
                        <span>
                          {actividadDetalle.horaInicio || "-"} - {actividadDetalle.horaFin || "-"}
                        </span>
                      </div>
                      <div className="col-md-12 mb-2">
                        <small className="text-muted d-block">
                          {actividadDetalle.modalidad === "Virtual" ? "Enlace virtual" : "Ubicacion"}
                        </small>
                        {actividadDetalle.modalidad === "Virtual" && actividadDetalle.meetUrl ? (
                          <a href={actividadDetalle.meetUrl} target="_blank" rel="noreferrer">
                            {actividadDetalle.meetUrl}
                          </a>
                        ) : (
                          <span>{actividadDetalle.ubicacion || "-"}</span>
                        )}
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Costo</small>
                        <span>{valorCosto(actividadDetalle)}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Participantes / Confirmados</small>
                        <span>
                          {Number(actividadDetalle.participantes) || 0} / {Number(actividadDetalle.asistentesConfirmados) || 0}
                        </span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Creador</small>
                        <span>{actividadDetalle.creador || "-"}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Aprobador</small>
                        <span>{actividadDetalle.aprobador || "-"}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Emitir certificado</small>
                        <span>{actividadDetalle.emiteCertificado ? "Si" : "No"}</span>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted d-block">Certificados</small>
                        <span>{actividadDetalle.certificados || "-"}</span>
                      </div>
                      <div className="col-md-12 mb-0">
                        <small className="text-muted d-block">Descripcion</small>
                        <span>{actividadDetalle.descripcion || "Sin descripcion"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .otras-actividades-page button:focus,
        .otras-actividades-page button:focus-visible,
        .otras-actividades-page .btn:focus,
        .otras-actividades-page .btn:focus-visible,
        .otras-actividades-page .nav-link:focus,
        .otras-actividades-page .nav-link:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
