"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getMenuForRole } from "@/lib/navigation/menu";


export default function TemplateShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  useEffect(() => {
    try {
      let nombre = "";
      let role = null;

      // 1. Leer objeto user guardado en login (tiene nombre/apellido/role)
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        nombre = [u.nombre, u.apellido].filter(Boolean).join(" ").trim() || u.email || "";
        role = u.role || null;
      }

      // 2. JWT como fuente de verdad para el rol (firmado por el servidor)
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(decodeURIComponent(atob(base64).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
          role = payload.role || role;
          if (!nombre) {
            nombre = payload.name || payload.nombre || payload.sub || "";
          }
        } catch (_) {}
      }

      setNombreUsuario(nombre);
      setMenuItems(getMenuForRole(role));
    } catch (_) {}
  }, [pathname]); // re-corre en cada navegación → captura token post-login

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    // Llamar al servidor para borrar las cookies HttpOnly
    // (JS no puede borrar cookies HttpOnly directamente)
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    // Limpiar localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isLoginPage  = pathname?.startsWith("/login");
  const isKioscoPage = pathname?.startsWith("/kiosco");

  if (isLoginPage)  return <div className="login-container">{children}</div>;
  if (isKioscoPage) return <>{children}</>;


  return (
    <>
      {/* ── left-sidebar: solo logo + módulos ── */}
      <div id="left-sidebar" className="sidebar" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        left: 0, 
        position: 'fixed' 
      }}>
        <div className="brand-name" style={{ textAlign: 'center', padding: '10px 15px' }}>
          <img src="/logou.png" alt="USPG" style={{ maxWidth: '182px', height: 'auto' }} />
        </div>
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <a className="nav-link active" data-toggle="tab" href="#menu-uni">Módulos</a>
          </li>
        </ul>
        <div className="tab-content mt-3" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          <div className="tab-pane fade show active" id="menu-uni" role="tabpanel">
            <nav className="sidebar-nav">
              <ul className="metismenu">
                {menuItems.map((item) => (
                  <li key={item.path} className={pathname === item.path ? "active" : ""}>
                    <Link href={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className={`fa ${item.icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Logout Button at the very bottom */}
        <div style={{ 
          padding: '15px 20px', 
          borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          background: 'transparent'
        }}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} 
             style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '12px', 
               color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
               textDecoration: 'none',
               fontSize: '14px',
               transition: 'color 0.2s'
             }}
             onMouseOver={(e) => e.currentTarget.style.color = '#ff4d4d'}
             onMouseOut={(e) => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'}
          >
            <i className="fa fa-sign-out" style={{ fontSize: '18px' }}></i>
            <span>Cerrar sesión</span>
          </a>
        </div>
      </div>

      {/* ── page: contenido principal ── */}
      <div className="page">
        {/* Header bar */}
        <div className="page-header" style={{
          background: 'transparent',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          marginBottom: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa fa-graduation-cap" style={{ color: isDark ? '#aaa' : '#555', fontSize: '18px' }}></i>
            <span style={{ color: isDark ? '#fff' : '#333', fontWeight: 600, fontSize: '15px' }}>Proyecto Integrador — USPG</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Theme Toggle Button */}
            <div onClick={toggleTheme} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="fa fa-adjust" style={{ color: isDark ? '#fff' : '#333', fontSize: '18px' }}></i>
            </div>
            
            <i className="fa fa-bell-o" style={{ color: isDark ? '#aaa' : '#555', fontSize: '16px', cursor: 'pointer' }}></i>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {nombreUsuario && (
                <span style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)', fontSize: '14px', fontWeight: 500 }}>
                  {nombreUsuario}
                </span>
              )}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#800020',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}>
                <i className="fa fa-user" style={{ fontSize: '16px' }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="section-body mt-3">
          <div className="container-fluid">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
