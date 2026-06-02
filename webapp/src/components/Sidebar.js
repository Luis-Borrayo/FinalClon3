"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Inicio",                         path: "/",                              icon: "fa-dashboard" },
  { name: "Sistema Académico",              path: "/sistema-academico",             icon: "fa-graduation-cap" },
  { name: "Control de Notas",               path: "/control-de-notas",              icon: "fa-file-text-o" },
  { name: "Laboratorios",                   path: "/laboratorios",                  icon: "fa-flask" },
  { name: "Biblioteca",                     path: "/biblioteca",                    icon: "fa-book" },
  { name: "Parqueo",                        path: "/parqueo",                       icon: "fa-car" },
  { name: "Pagos Alumnos",                  path: "/pagos-alumnos",                 icon: "fa-money" },
  { name: "Servicios Móviles e Integrador", path: "/servicios-moviles-integrador",  icon: "fa-mobile" },
  { name: "Administración",                 path: "/administracion",                icon: "fa-cogs" },
  { name: "Otras actividades",              path: "/otras-actividades",             icon: "fa-star" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div id="left-sidebar" className="sidebar">
      {/* Logo */}
      <div className="brand-name" style={{ textAlign: "center", padding: "16px 12px" }}>
        <img
          src="/logou.png"
          alt="USPG"
          style={{ maxWidth: "130px", height: "auto", display: "block", margin: "0 auto" }}
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="metismenu" id="menu">
          <li className="g_heading">Módulos</li>
          {menuItems.map((item) => (
            <li key={item.path} className={pathname === item.path ? "active" : ""}>
              <Link href={item.path}>
                <i className={`fa ${item.icon}`}></i>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
