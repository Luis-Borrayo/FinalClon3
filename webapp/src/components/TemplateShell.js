"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const menuItems = [
  { name: "Dashboard",                      path: "/",                              icon: "fa-dashboard" },
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

export default function TemplateShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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

        <div className="section-body mt-3">
          <div className="container-fluid">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
