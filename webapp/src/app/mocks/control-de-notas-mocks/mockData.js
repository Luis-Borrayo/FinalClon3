const mockData = {
  alumnos: [
    {
      carnet: "2021001",
      nombre: "Carlos Andrés Pérez López",
      email: "carlos.perez@universidad.edu",
      carrera: "Ingeniería en Sistemas",
      fechaIngreso: "2021-01-15",
      estado: "activo",
    },
    {
      carnet: "2021002",
      nombre: "María Fernanda García Ramos",
      email: "maria.garcia@universidad.edu",
      carrera: "Administración de Empresas",
      fechaIngreso: "2021-01-15",
      estado: "activo",
    },
    {
      carnet: "2019003",
      nombre: "José Roberto Méndez Cruz",
      email: "jose.mendez@universidad.edu",
      carrera: "Ingeniería en Sistemas",
      fechaIngreso: "2019-01-15",
      estado: "activo",
    },
    {
      carnet: "2020004",
      nombre: "Ana Lucía Rodríguez Vásquez",
      email: "ana.rodriguez@universidad.edu",
      carrera: "Contaduría Pública",
      fechaIngreso: "2020-01-15",
      estado: "activo",
    },
    {
      carnet: "2018005",
      nombre: "Luis Enrique Torres Molina",
      email: "luis.torres@universidad.edu",
      carrera: "Ingeniería en Sistemas",
      fechaIngreso: "2018-01-15",
      estado: "activo",
    },
  ],

  notas: {
    "2021001": [
      { curso: "ING101", nombreCurso: "Matemática 1",            periodo: "2024-1", zona: 65, examenFinal: 72, notaFinal: 68.5,  estado: "aprobado",  creditos: 4 },
      { curso: "ING102", nombreCurso: "Programación 1",          periodo: "2024-1", zona: 78, examenFinal: 85, notaFinal: 81.5,  estado: "aprobado",  creditos: 4 },
      { curso: "GEN101", nombreCurso: "Comunicación y Lenguaje", periodo: "2023-2", zona: 80, examenFinal: 75, notaFinal: 77.5,  estado: "aprobado",  creditos: 3 },
      { curso: "ING201", nombreCurso: "Estructuras de Datos",    periodo: "2024-2", zona: 55, examenFinal: 58, notaFinal: 56.5,  estado: "reprobado", creditos: 4 },
    ],
    "2021002": [
      { curso: "ADM101", nombreCurso: "Fundamentos de Administración", periodo: "2024-1", zona: 88, examenFinal: 92, notaFinal: 90,   estado: "aprobado", creditos: 4 },
      { curso: "GEN101", nombreCurso: "Comunicación y Lenguaje",       periodo: "2024-1", zona: 95, examenFinal: 90, notaFinal: 92.5, estado: "aprobado", creditos: 3 },
      { curso: "GEN102", nombreCurso: "Ética Profesional",             periodo: "2023-2", zona: 82, examenFinal: 79, notaFinal: 80.5, estado: "aprobado", creditos: 2 },
    ],
    "2019003": [
      { curso: "ING101", nombreCurso: "Matemática 1",            periodo: "2020-1", zona: 70, examenFinal: 68, notaFinal: 69,   estado: "aprobado", creditos: 4 },
      { curso: "ING102", nombreCurso: "Programación 1",          periodo: "2020-1", zona: 85, examenFinal: 88, notaFinal: 86.5, estado: "aprobado", creditos: 4 },
      { curso: "ING201", nombreCurso: "Estructuras de Datos",    periodo: "2020-2", zona: 75, examenFinal: 80, notaFinal: 77.5, estado: "aprobado", creditos: 4 },
      { curso: "ING202", nombreCurso: "Base de Datos 1",         periodo: "2021-1", zona: 72, examenFinal: 78, notaFinal: 75,   estado: "aprobado", creditos: 4 },
      { curso: "ING301", nombreCurso: "Redes de Computadoras",   periodo: "2021-2", zona: 68, examenFinal: 74, notaFinal: 71,   estado: "aprobado", creditos: 4 },
      { curso: "ING302", nombreCurso: "Sistemas Operativos",     periodo: "2022-1", zona: 80, examenFinal: 82, notaFinal: 81,   estado: "aprobado", creditos: 4 },
      { curso: "ING401", nombreCurso: "Ingeniería de Software",  periodo: "2022-2", zona: 78, examenFinal: 85, notaFinal: 81.5, estado: "aprobado", creditos: 4 },
      { curso: "GEN101", nombreCurso: "Comunicación y Lenguaje", periodo: "2020-1", zona: 88, examenFinal: 84, notaFinal: 86,   estado: "aprobado", creditos: 3 },
      { curso: "GEN102", nombreCurso: "Ética Profesional",       periodo: "2020-2", zona: 90, examenFinal: 87, notaFinal: 88.5, estado: "aprobado", creditos: 2 },
    ],
    "2020004": [
      { curso: "GEN101", nombreCurso: "Comunicación y Lenguaje", periodo: "2021-1", zona: 45, examenFinal: 50, notaFinal: 47.5, estado: "reprobado", creditos: 3 },
      { curso: "GEN101", nombreCurso: "Comunicación y Lenguaje", periodo: "2021-2", zona: 68, examenFinal: 72, notaFinal: 70,   estado: "aprobado",  creditos: 3, esRepeticion: true },
    ],
    "2018005": [
      { curso: "ING101", nombreCurso: "Matemática 1",            periodo: "2019-1", zona: 72, examenFinal: 75, notaFinal: 73.5, estado: "aprobado", creditos: 4 },
      { curso: "ING102", nombreCurso: "Programación 1",          periodo: "2019-1", zona: 90, examenFinal: 95, notaFinal: 92.5, estado: "aprobado", creditos: 4 },
      { curso: "ING201", nombreCurso: "Estructuras de Datos",    periodo: "2019-2", zona: 85, examenFinal: 88, notaFinal: 86.5, estado: "aprobado", creditos: 4 },
      { curso: "ING202", nombreCurso: "Base de Datos 1",         periodo: "2020-1", zona: 78, examenFinal: 82, notaFinal: 80,   estado: "aprobado", creditos: 4 },
      { curso: "ING301", nombreCurso: "Redes de Computadoras",   periodo: "2020-2", zona: 75, examenFinal: 80, notaFinal: 77.5, estado: "aprobado", creditos: 4 },
      { curso: "ING302", nombreCurso: "Sistemas Operativos",     periodo: "2021-1", zona: 82, examenFinal: 85, notaFinal: 83.5, estado: "aprobado", creditos: 4 },
      { curso: "ING401", nombreCurso: "Ingeniería de Software",  periodo: "2021-2", zona: 88, examenFinal: 90, notaFinal: 89,   estado: "aprobado", creditos: 4 },
      { curso: "GEN101", nombreCurso: "Comunicación y Lenguaje", periodo: "2019-1", zona: 92, examenFinal: 90, notaFinal: 91,   estado: "aprobado", creditos: 3 },
      { curso: "GEN102", nombreCurso: "Ética Profesional",       periodo: "2019-2", zona: 88, examenFinal: 85, notaFinal: 86.5, estado: "aprobado", creditos: 2 },
    ],
  },

  asistencias: {
    "2021001": {
      ING101: {
        curso: "ING101", nombreCurso: "Matemática 1", periodo: "2024-1",
        totalClases: 40, asistencias: 35, ausencias: 5, porcentajeAsistencia: 87.5,
        registros: [
          { fecha: "2024-01-08", estado: "presente" },
          { fecha: "2024-01-10", estado: "presente" },
          { fecha: "2024-01-15", estado: "ausente"  },
          { fecha: "2024-01-17", estado: "presente" },
          { fecha: "2024-01-22", estado: "presente" },
          { fecha: "2024-01-24", estado: "presente" },
          { fecha: "2024-01-29", estado: "ausente"  },
          { fecha: "2024-01-31", estado: "presente" },
          { fecha: "2024-02-05", estado: "presente" },
          { fecha: "2024-02-07", estado: "presente" },
        ],
      },
      ING102: {
        curso: "ING102", nombreCurso: "Programación 1", periodo: "2024-1",
        totalClases: 40, asistencias: 38, ausencias: 2, porcentajeAsistencia: 95,
        registros: [
          { fecha: "2024-01-08", estado: "presente" },
          { fecha: "2024-01-10", estado: "presente" },
          { fecha: "2024-01-15", estado: "presente" },
          { fecha: "2024-01-17", estado: "ausente"  },
          { fecha: "2024-01-22", estado: "presente" },
          { fecha: "2024-01-24", estado: "presente" },
          { fecha: "2024-01-29", estado: "presente" },
          { fecha: "2024-01-31", estado: "presente" },
          { fecha: "2024-02-05", estado: "ausente"  },
          { fecha: "2024-02-07", estado: "presente" },
        ],
      },
    },
    "2021002": {
      ADM101: {
        curso: "ADM101", nombreCurso: "Fundamentos de Administración", periodo: "2024-1",
        totalClases: 40, asistencias: 40, ausencias: 0, porcentajeAsistencia: 100,
        registros: [
          { fecha: "2024-01-08", estado: "presente" },
          { fecha: "2024-01-10", estado: "presente" },
          { fecha: "2024-01-15", estado: "presente" },
          { fecha: "2024-01-17", estado: "presente" },
          { fecha: "2024-01-22", estado: "presente" },
        ],
      },
    },
    "2019003": {
      ING401: {
        curso: "ING401", nombreCurso: "Ingeniería de Software", periodo: "2022-2",
        totalClases: 40, asistencias: 36, ausencias: 4, porcentajeAsistencia: 90,
        registros: [
          { fecha: "2022-07-11", estado: "presente" },
          { fecha: "2022-07-13", estado: "presente" },
          { fecha: "2022-07-18", estado: "ausente"  },
          { fecha: "2022-07-20", estado: "presente" },
          { fecha: "2022-07-25", estado: "presente" },
        ],
      },
    },
    "2018005": {
      ING401: {
        curso: "ING401", nombreCurso: "Ingeniería de Software", periodo: "2021-2",
        totalClases: 40, asistencias: 39, ausencias: 1, porcentajeAsistencia: 97.5,
        registros: [
          { fecha: "2021-07-12", estado: "presente" },
          { fecha: "2021-07-14", estado: "presente" },
          { fecha: "2021-07-19", estado: "presente" },
          { fecha: "2021-07-21", estado: "ausente"  },
          { fecha: "2021-07-26", estado: "presente" },
        ],
      },
    },
  },

  solvenciaPagos: {
    "2021001": { carnet: "2021001", solvente: true,  ultimoPago: "2024-01-10", montoPendiente: 0,     periodoActual: "2024-1", detalles: [] },
    "2021002": { carnet: "2021002", solvente: true,  ultimoPago: "2024-01-08", montoPendiente: 0,     periodoActual: "2024-1", detalles: [] },
    "2019003": { carnet: "2019003", solvente: false, ultimoPago: "2023-12-05", montoPendiente: 850.0, periodoActual: "2024-1", detalles: [{ concepto: "Cuota enero 2024", monto: 850.0, vencimiento: "2024-01-15" }] },
    "2020004": { carnet: "2020004", solvente: true,  ultimoPago: "2024-01-12", montoPendiente: 0,     periodoActual: "2024-1", detalles: [] },
    "2018005": { carnet: "2018005", solvente: true,  ultimoPago: "2024-01-05", montoPendiente: 0,     periodoActual: "2024-1", detalles: [] },
  },

  requisitosGraduacion: {
    creditosRequeridos: 200,
    notaMinimaAprobacion: 61,
    porcentajeAsistenciaMinimo: 80,
    cursosObligatorios: ["ING101","ING102","ING201","ING202","ING301","ING302","ING401","GEN101","GEN102"],
    documentosRequeridos: ["Foto reciente","DPI","Partida de nacimiento","Título de diversificado","Solvencia de pagos"],
  },

  usuarios: [
    { id: "2021001", carnet: "2021001", password: "2021001", nombre: "Carlos Andrés",  apellido: "Pérez López",       email: "carlos.perez@universidad.edu",  rol: "ALUMNO",      activo: true },
    { id: "2021002", carnet: "2021002", password: "2021002", nombre: "María Fernanda", apellido: "García Ramos",      email: "maria.garcia@universidad.edu",  rol: "ALUMNO",      activo: true },
    { id: "2019003", carnet: "2019003", password: "2019003", nombre: "José Roberto",   apellido: "Méndez Cruz",       email: "jose.mendez@universidad.edu",   rol: "ALUMNO",      activo: true },
    { id: "2020004", carnet: "2020004", password: "2020004", nombre: "Ana Lucía",      apellido: "Rodríguez Vásquez", email: "ana.rodriguez@universidad.edu", rol: "ALUMNO",      activo: true },
    { id: "2018005", carnet: "2018005", password: "2018005", nombre: "Luis Enrique",   apellido: "Torres Molina",     email: "luis.torres@universidad.edu",   rol: "ALUMNO",      activo: true },
    { id: "CAT001",  carnet: "CAT001",  password: "cat001",  nombre: "Roberto",        apellido: "Hernández",         email: "roberto.hernandez@universidad.edu", rol: "CATEDRATICO", activo: true },
    { id: "CAT002",  carnet: "CAT002",  password: "cat002",  nombre: "Sandra",         apellido: "Martínez",          email: "sandra.martinez@universidad.edu",   rol: "CATEDRATICO", activo: true },
    { id: "CAT003",  carnet: "CAT003",  password: "cat003",  nombre: "Miguel",         apellido: "López",             email: "miguel.lopez@universidad.edu",      rol: "CATEDRATICO", activo: true },
    { id: "admin",   carnet: "admin",   password: "admin123",nombre: "Administrador",  apellido: "",                  email: "admin@universidad.edu",             rol: "ADMIN",       activo: true },
  ],

  horarios: [
    { id: "H001", curso: "ING101", nombreCurso: "Matemática 1",            salon: "A-101", dia: "Lunes",     horaInicio: "07:00", horaFin: "09:00", ciclo: "2024-1", catedratico: null },
    { id: "H002", curso: "ING102", nombreCurso: "Programación 1",          salon: "B-203", dia: "Martes",    horaInicio: "09:00", horaFin: "11:00", ciclo: "2024-1", catedratico: null },
    { id: "H003", curso: "ING201", nombreCurso: "Estructuras de Datos",    salon: "C-305", dia: "Miércoles", horaInicio: "11:00", horaFin: "13:00", ciclo: "2024-1", catedratico: null },
    { id: "H004", curso: "ING202", nombreCurso: "Base de Datos 1",         salon: "A-102", dia: "Jueves",    horaInicio: "14:00", horaFin: "16:00", ciclo: "2024-1", catedratico: null },
    { id: "H005", curso: "GEN101", nombreCurso: "Comunicación y Lenguaje", salon: "D-401", dia: "Viernes",   horaInicio: "07:00", horaFin: "09:00", ciclo: "2024-1", catedratico: null },
    { id: "H006", curso: "ING301", nombreCurso: "Redes de Computadoras",   salon: "B-204", dia: "Lunes",     horaInicio: "14:00", horaFin: "16:00", ciclo: "2024-1", catedratico: null },
    { id: "H007", curso: "ING302", nombreCurso: "Sistemas Operativos",     salon: "C-306", dia: "Martes",    horaInicio: "14:00", horaFin: "16:00", ciclo: "2024-1", catedratico: null },
    { id: "H008", curso: "ING401", nombreCurso: "Ingeniería de Software",  salon: "A-201", dia: "Miércoles", horaInicio: "07:00", horaFin: "09:00", ciclo: "2024-1", catedratico: null },
  ],

  asignacionesCatedratico: [
    { id: "AC001", catedratico: "CAT001", horarioId: "H001", ciclo: "2024-1" },
    { id: "AC002", catedratico: "CAT001", horarioId: "H002", ciclo: "2024-1" },
    { id: "AC003", catedratico: "CAT002", horarioId: "H003", ciclo: "2024-1" },
  ],

  notasDetalle: {
    "2021001": {
      ING101: { zona: 65, examenFinal: 72, cierreSolicitado: false, cierrePendiente: false },
      ING102: { zona: 78, examenFinal: 85, cierreSolicitado: false, cierrePendiente: false },
      ING201: { zona: 55, examenFinal: 58, cierreSolicitado: false, cierrePendiente: false },
      GEN101: { zona: 80, examenFinal: 75, cierreSolicitado: true,  cierrePendiente: false },
    },
    "2021002": {
      ADM101: { zona: 88, examenFinal: 92, cierreSolicitado: true, cierrePendiente: false },
      GEN101: { zona: 95, examenFinal: 90, cierreSolicitado: true, cierrePendiente: false },
      GEN102: { zona: 82, examenFinal: 79, cierreSolicitado: true, cierrePendiente: false },
    },
    "2019003": {
      ING101: { zona: 70, examenFinal: 68, cierreSolicitado: true, cierrePendiente: false },
      ING102: { zona: 85, examenFinal: 88, cierreSolicitado: true, cierrePendiente: false },
      ING201: { zona: 75, examenFinal: 80, cierreSolicitado: true, cierrePendiente: false },
      ING202: { zona: 72, examenFinal: 78, cierreSolicitado: true, cierrePendiente: false },
      ING301: { zona: 68, examenFinal: 74, cierreSolicitado: true, cierrePendiente: false },
      ING302: { zona: 80, examenFinal: 82, cierreSolicitado: true, cierrePendiente: false },
      ING401: { zona: 78, examenFinal: 85, cierreSolicitado: true, cierrePendiente: false },
      GEN101: { zona: 88, examenFinal: 84, cierreSolicitado: true, cierrePendiente: false },
      GEN102: { zona: 90, examenFinal: 87, cierreSolicitado: true, cierrePendiente: false },
    },
    "2020004": {
      GEN101: { zona: 68, examenFinal: 72, cierreSolicitado: true, cierrePendiente: false },
    },
    "2018005": {
      ING101: { zona: 72, examenFinal: 75, cierreSolicitado: true, cierrePendiente: false },
      ING102: { zona: 90, examenFinal: 95, cierreSolicitado: true, cierrePendiente: false },
      ING201: { zona: 85, examenFinal: 88, cierreSolicitado: true, cierrePendiente: false },
      ING202: { zona: 78, examenFinal: 82, cierreSolicitado: true, cierrePendiente: false },
      ING301: { zona: 75, examenFinal: 80, cierreSolicitado: true, cierrePendiente: false },
      ING302: { zona: 82, examenFinal: 85, cierreSolicitado: true, cierrePendiente: false },
      ING401: { zona: 88, examenFinal: 90, cierreSolicitado: true, cierrePendiente: false },
      GEN101: { zona: 92, examenFinal: 90, cierreSolicitado: true, cierrePendiente: false },
      GEN102: { zona: 88, examenFinal: 85, cierreSolicitado: true, cierrePendiente: false },
    },
  },

  solicitudesCierre: [
    { id: "SC001", catedratico: "CAT001", horarioId: "H001", curso: "ING101", nombreCurso: "Matemática 1",   ciclo: "2024-1", estado: "pendiente", fechaSolicitud: "2024-06-01", observaciones: "Todos los alumnos tienen zona ingresada." },
    { id: "SC002", catedratico: "CAT001", horarioId: "H002", curso: "ING102", nombreCurso: "Programación 1", ciclo: "2024-1", estado: "aprobado",  fechaSolicitud: "2024-05-28", observaciones: "Notas completas." },
  ],
};

export default mockData;