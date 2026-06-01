import Link from "next/link";

const modules = [
  {
    href: "/sistema-academico",
    title: "Sistema académico",
    description: "Asignaciones, cursos, estudiantes, docentes, horarios y asistencia.",
    icon: "fa-graduation-cap",
    bg: "bg-azure",
  },
  {
    href: "/control-de-notas",
    title: "Control de notas",
    description: "Redes de curso por carrera, zonas, evaluaciones, cierres y graduaciones.",
    icon: "fa-file-text-o",
    bg: "bg-green",
  },
  {
    href: "/laboratorios",
    title: "Laboratorios",
    description: "Gestión de laboratorios.",
    icon: "fa-flask",
    bg: "bg-orange",
  },
  {
    href: "/biblioteca",
    title: "Biblioteca",
    description: "Material disponible, préstamos y estudiantes.",
    icon: "fa-book",
    bg: "bg-indigo",
  },
  {
    href: "/parqueo",
    title: "Parqueo",
    description: "Tarifas, ingresos y capacidades.",
    icon: "fa-car",
    bg: "bg-pink",
  },
  {
    href: "/pagos-alumnos",
    title: "Pagos alumnos",
    description: "Inscripción, mensualidades, otros pagos y solvencias.",
    icon: "fa-money",
    bg: "bg-cyan",
  },
  {
    href: "/servicios-moviles-integrador",
    title: "Servicios móviles e integrador",
    description: "Servicios móviles e integración entre sistemas.",
    icon: "fa-mobile",
    bg: "bg-dark",
  },
  {
    href: "/administracion",
    title: "Administración",
    description: "Planta física, aulas, auditorio, mantenimiento y logística.",
    icon: "fa-cogs",
    bg: "bg-yellow",
  },
  {
    href: "/otras-actividades",
    title: "Otras actividades",
    description: "Gestión de eventos, actividades deportivas, culturales y más.",
    icon: "fa-star",
    bg: "bg-red",
  },
];

export default function Home() {
  return (
    <>

      <div className="row clearfix">
        {modules.map((m) => (
          <div key={m.href} className="col-lg-3 col-md-6 col-sm-12">
            <Link href={m.href} style={{textDecoration: 'none'}}>
              <div className="card dashboard-card">
                <div className="card-body">
                  <div className="icon-wrapper">
                    <i className={`fa ${m.icon}`}></i>
                  </div>
                  <div className="content-wrapper">
                    <h5 className="mb-1" style={{ color: '#800020', fontWeight: 'bold' }}>{m.title}</h5>
                    <div className="module-subtitle">Explorar módulo</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
