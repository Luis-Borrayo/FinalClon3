"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard",  path: "/parqueo",            icon: "fa-tachometer" },
  { label: "Mapa",       path: "/parqueo/mapa",        icon: "fa-map" },
  { label: "Sesiones",   path: "/parqueo/sesiones",    icon: "fa-clock-o" },
  { label: "Escáner QR", path: "/parqueo/escaner",     icon: "fa-qrcode" },
  { label: "Vehículos",  path: "/parqueo/vehiculos",   icon: "fa-car" },
  { label: "Reservas",   path: "/parqueo/reservas",    icon: "fa-calendar" },
  { label: "Reportes",   path: "/parqueo/reportes",    icon: "fa-bar-chart" },
  { label: "Seguridad",  path: "/parqueo/seguridad",   icon: "fa-shield" },
];

export default function ParqueoLayout({ children }) {
  const pathname = usePathname();

  return (
    <div>
      {/* Encabezado del módulo */}
      <div className="row clearfix">
        <div className="col-12">
          <div style={{ marginBottom: "1.25rem" }}>
            <h4 style={{ color: "#800020", fontWeight: 700, marginBottom: "4px" }}>
              <i className="fa fa-car" style={{ marginRight: "8px" }} />
              Sistema de Parqueo — USPG
            </h4>
            <small style={{ color: "#7d8490" }}>Campus Central · 500 espacios · Lat 14.5847, Lng -90.5085</small>
          </div>

          {/* Tabs de navegación */}
          <ul className="nav nav-tabs" style={{ borderBottom: "2px solid #343a40", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {tabs.map((t) => {
              const isActive = pathname === t.path;
              return (
                <li className="nav-item" key={t.path}>
                  <Link
                    href={t.path}
                    className={`nav-link${isActive ? " active" : ""}`}
                    style={{
                      color: isActive ? "#800020" : "#7d8490",
                      borderBottom: isActive ? "2px solid #800020" : "2px solid transparent",
                      background: "transparent",
                      fontWeight: isActive ? 600 : 400,
                      marginBottom: "-2px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <i className={`fa ${t.icon}`} />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {children}
    </div>
  );
}
