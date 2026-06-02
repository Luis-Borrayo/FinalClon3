"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getMenuForRole } from "@/lib/navigation/menu";

const ALL_MODULES = [
  {
    href: "/sistema-academico",
    title: "Sistema académico",
    description: "Asignaciones, cursos, estudiantes, docentes, horarios y asistencia.",
    icon: "fa-graduation-cap",
  },
  {
    href: "/control-de-notas",
    title: "Control de notas",
    description: "Redes de curso por carrera, zonas, evaluaciones, cierres y graduaciones.",
    icon: "fa-file-text-o",
  },
  {
    href: "/laboratorios",
    title: "Laboratorios",
    description: "Gestión de laboratorios.",
    icon: "fa-flask",
  },
  {
    href: "/biblioteca",
    title: "Biblioteca",
    description: "Material disponible, préstamos y estudiantes.",
    icon: "fa-book",
  },
  {
    href: "/parqueo",
    title: "Parqueo",
    description: "Tarifas, ingresos y capacidades.",
    icon: "fa-car",
  },
  {
    href: "/pagos-alumnos",
    title: "Pagos alumnos",
    description: "Inscripción, mensualidades, otros pagos y solvencias.",
    icon: "fa-money",
  },
  {
    href: "/servicios-moviles-integrador",
    title: "Servicios móviles e integrador",
    description: "Servicios móviles e integración entre sistemas.",
    icon: "fa-mobile",
  },
  {
    href: "/administracion",
    title: "Administración",
    description: "Planta física, aulas, auditorio, mantenimiento y logística.",
    icon: "fa-cogs",
  },
  {
    href: "/otras-actividades",
    title: "Otras actividades",
    description: "Gestión de eventos, actividades deportivas, culturales y más.",
    icon: "fa-star",
  },
];

export default function Home() {
  const [modules, setModules] = useState(ALL_MODULES);

  useEffect(() => {
    try {
      let role = null;

      // Leer rol del objeto user guardado en login
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        role = u.role || null;
      }

      // JWT como fuente de verdad (firmado por servidor)
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(decodeURIComponent(atob(base64).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
          role = payload.role || role;
        } catch (_) {}
      }

      if (role) {
        // Usar las mismas rutas del menú lateral para filtrar las tarjetas
        const menuPaths = new Set(getMenuForRole(role).map(item => item.path));
        setModules(ALL_MODULES.filter(m => menuPaths.has(m.href)));
      }
    } catch (_) {}
  }, []);

  return (
    <>
      <div className="row clearfix">
        {modules.map((m) => (
          <div key={m.href} className="col-lg-3 col-md-6 col-sm-12">
            <Link href={m.href} style={{ textDecoration: "none" }}>
              <div className="card dashboard-card">
                <div className="card-body">
                  <div className="icon-wrapper">
                    <i className={`fa ${m.icon}`}></i>
                  </div>
                  <div className="content-wrapper">
                    <h5 className="mb-1" style={{ color: "#800020", fontWeight: "bold" }}>{m.title}</h5>
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
