"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const tabs = [
  { label: "Dashboard",       path: "/parqueo",                  icon: "fa-tachometer" },
  { label: "Mapa",           path: "/parqueo/mapa",             icon: "fa-map"        },
  { label: "Sesiones",       path: "/parqueo/sesiones",         icon: "fa-clock-o"    },
  { label: "Escáner QR",     path: "/parqueo/escaner",          icon: "fa-qrcode"     },
  { label: "Vehículos",      path: "/parqueo/vehiculos",        icon: "fa-car"        },
  { label: "Reservas",       path: "/parqueo/reservas",         icon: "fa-calendar"   },
  { label: "Eventos",        path: "/parqueo/eventos",          icon: "fa-flag"       },
  { label: "Reportes",       path: "/parqueo/reportes",         icon: "fa-bar-chart"  },
  { label: "Tarjetas NFC",   path: "/parqueo/tarjetas",         icon: "fa-credit-card" },
  { label: "Seguridad",      path: "/parqueo/seguridad",        icon: "fa-shield"     },
  { label: "Tarifas",        path: "/parqueo/tarifas",          icon: "fa-usd"        },
  { label: "Suscripciones",  path: "/parqueo/suscripciones",    icon: "fa-id-card"    },
  { label: "Notificaciones", path: "/parqueo/notificaciones",   icon: "fa-bell", badge: true },
  { label: "Mi QR",          path: "/parqueo/mi-qr",            icon: "fa-qrcode" },
  { label: "Benchmark",      path: "/parqueo/benchmark",        icon: "fa-bolt"   },
];

export default function ParqueoLayout({ children }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get("/notifications", { params: { limit: 1 } })
      .then(r => setUnread(r.data?.data?.unread || 0))
      .catch(() => {});
    const interval = setInterval(() => {
      api.get("/notifications", { params: { limit: 1 } })
        .then(r => setUnread(r.data?.data?.unread || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="row clearfix">
        <div className="col-12">
          <div style={{ marginBottom: "1.25rem" }}>
            <h4 style={{ color: "#800020", fontWeight: 700, marginBottom: "4px" }}>
              <i className="fa fa-car" style={{ marginRight: "8px" }} />
              Sistema de Parqueo — USPG
            </h4>
            <small style={{ color: "#7d8490" }}>Campus Central · 500 espacios · Lat 14.5847, Lng -90.5085</small>
          </div>

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
                      position: "relative",
                    }}
                  >
                    <i className={`fa ${t.icon}`} />
                    {t.label}
                    {t.badge && unread > 0 && (
                      <span style={{
                        background: "#db2828", color: "#fff", borderRadius: "10px",
                        fontSize: "10px", fontWeight: 700, padding: "1px 5px",
                        minWidth: 16, textAlign: "center", lineHeight: "14px",
                      }}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
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
