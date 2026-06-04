const ALL_ITEMS = [
  { name: 'Dashboard',                   path: '/',                          icon: 'fa-dashboard',   roles: ['ADMIN','TEACHER','STUDENT','SECURITY'] },
  { name: 'Sistema Académico',           path: '/sistema-academico',         icon: 'fa-graduation-cap', roles: ['ADMIN','TEACHER','STUDENT'] },
  { name: 'Control de Notas',            path: '/control-de-notas',          icon: 'fa-file-text-o', roles: ['ADMIN','TEACHER','STUDENT'] },
  { name: 'Laboratorios',                path: '/laboratorios',              icon: 'fa-flask',       roles: ['ADMIN','TEACHER','STUDENT'] },
  { name: 'Biblioteca',                  path: '/biblioteca',                icon: 'fa-book',        roles: ['ADMIN','TEACHER','STUDENT'] },
  { name: 'Parqueo',                     path: '/parqueo',                   icon: 'fa-car',         roles: ['ADMIN','TEACHER','STUDENT','SECURITY','VISITOR'] },
  { name: 'Pagos Alumnos',              path: '/pagos-alumnos',             icon: 'fa-money',       roles: ['ADMIN','STUDENT'] },
  { name: 'Servicios Móviles e Integrador', path: '/servicios-moviles-integrador', icon: 'fa-mobile', roles: ['ADMIN'] },
  { name: 'Administración',             path: '/administracion',            icon: 'fa-cogs',        roles: ['ADMIN','TEACHER','STUDENT'] },
  { name: 'Otras actividades',          path: '/otras-actividades',         icon: 'fa-star',        roles: ['ADMIN','TEACHER','STUDENT'] },
];

/**
 * Devuelve solo los ítems que el rol puede ver.
 * Si no se pasa rol (usuario no autenticado) devuelve lista vacía.
 */
export function getMenuForRole(role) {
  if (!role) return [];
  return ALL_ITEMS.filter(item => item.roles.includes(role));
}

/** Lista completa (para admins o cuando no se filtra). */
export const MODULE_MENU_ITEMS = ALL_ITEMS;

/** Ruta activa: coincide exacta o subruta (excepto inicio). */
export function isNavActive(itemPath, pathname) {
  if (!pathname) return false;
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
