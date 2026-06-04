// src/lib/administracion/constants.js
// Labels, iconos y colores para el módulo de Administración de Espacios

export const TIPO_ESPACIO_LABEL = {
  AUDITORIO:        'Auditorio',
  LABORATORIO_ADMIN: 'Laboratorio',
  SALA_REUNIONES:   'Sala de Reuniones',
  CANCHA:           'Cancha / Área Deportiva',
  OTRO:             'Otro',
}

export const TIPO_ESPACIO_ICON_FA = {
  AUDITORIO:        'fa-microphone',
  LABORATORIO_ADMIN: 'fa-flask',
  SALA_REUNIONES:   'fa-users',
  CANCHA:           'fa-soccer-ball-o',
  OTRO:             'fa-building',
}

export const ESTADO_ESPACIO_LABEL = {
  DISPONIBLE:       'Disponible',
  OCUPADO:          'Ocupado',
  MANTENIMIENTO:    'En mantenimiento',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
}

export const ESTADO_RESERVA_ESPACIO_LABEL = {
  PENDIENTE:  'Pendiente',
  APROBADA:   'Aprobada',
  RECHAZADA:  'Rechazada',
  CANCELADA:  'Cancelada',
}

export const PRIORIDAD_LABEL = {
  BAJA:    'Baja',
  MEDIA:   'Media',
  ALTA:    'Alta',
  URGENTE: 'Urgente',
}

export const PRIORIDAD_COLOR = {
  BAJA:    'adm-badge-baja',
  MEDIA:   'adm-badge-media',
  ALTA:    'adm-badge-alta',
  URGENTE: 'adm-badge-urgente',
}

export const ESTADO_REPORTE_LABEL = {
  ABIERTO:    'Abierto',
  EN_PROCESO: 'En proceso',
  RESUELTO:   'Resuelto',
  CERRADO:    'Cerrado',
}

export const TIPO_ELEMENTO_LABEL = {
  AIRE_ACONDICIONADO: 'Aire Acondicionado',
  PROYECTOR:          'Proyector',
  MOBILIARIO:         'Mobiliario',
  OTRO:               'Otro',
}

export const TIPO_ELEMENTO_ICON = {
  AIRE_ACONDICIONADO: 'fa-snowflake-o',
  PROYECTOR:          'fa-video-camera',
  MOBILIARIO:         'fa-chair',
  OTRO:               'fa-wrench',
}
