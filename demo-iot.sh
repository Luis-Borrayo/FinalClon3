#!/bin/bash
# ── Demo IoT ESP32 — Sistema de Parqueo USPG ─────────────────────────────────
# Simula un sensor ultrasónico ESP32 actualizando espacios en tiempo real.
# Uso: ./demo-iot.sh

SERVER="http://localhost:3000/api/parqueo/spaces/sensor"
SPACES=("A-001" "A-002" "A-130" "B-001" "B-130")

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

send() {
  local code=$1 status=$2
  local result=$(curl -s -X POST "$SERVER" \
    -H "Content-Type: application/json" \
    -d "{\"space_code\":\"$code\",\"status\":\"$status\"}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if d.get('success') else 'ERR')" 2>/dev/null)
  echo "$result"
}

header() {
  clear
  echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}║       🚗  DEMO IoT — Parqueo USPG  🚗                ║${RESET}"
  echo -e "${BOLD}║         Simulación sensor ESP32 + HC-SR04            ║${RESET}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

sensor_anim() {
  local space=$1 status=$2
  local dist_label icon color

  if [ "$status" == "OCCUPIED" ]; then
    dist_label="12 cm"
    icon="🔴"
    color=$RED
  else
    dist_label="85 cm"
    icon="🟢"
    color=$GREEN
  fi

  echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
  echo -e "  ${BOLD}Espacio:${RESET}  ${CYAN}$space${RESET}"
  echo -e "  ${BOLD}Sensor:${RESET}   [TRIG]━━━━━━━━━━━━━━━━━━━━━━━━[ECHO]"
  echo -ne "  ${BOLD}Midiendo${RESET}  "
  for i in 1 2 3; do sleep 0.15; echo -ne "▓"; done
  echo -e "  ${BOLD}${dist_label}${RESET}"
  echo -e "  ${BOLD}Estado:${RESET}   $icon  ${color}${status}${RESET}"
  echo -ne "  ${BOLD}Enviando al servidor${RESET}  "
  for i in 1 2 3; do sleep 0.1; echo -ne "."; done
  local r=$(send "$space" "$status")
  if [ "$r" == "OK" ]; then
    echo -e "  ${GREEN}✓ HTTP 200 — Mapa actualizado${RESET}"
  else
    echo -e "  ${RED}✗ Error${RESET}"
  fi
  echo ""
}

menu() {
  echo -e "${BOLD}  Selecciona una acción:${RESET}"
  echo ""
  echo -e "  ${CYAN}[1]${RESET} Ocupar A-001   → Zona A · Norte"
  echo -e "  ${CYAN}[2]${RESET} Liberar A-001  → Zona A · Norte"
  echo -e "  ${CYAN}[3]${RESET} Ocupar B-001   → Zona B · Sur"
  echo -e "  ${CYAN}[4]${RESET} Liberar B-001  → Zona B · Sur"
  echo -e "  ${CYAN}[5]${RESET} Demo automática  (A Norte, A Oeste, B Sur, B Este)"
  echo -e "  ${CYAN}[q]${RESET} Salir"
  echo ""
  echo -ne "  ${BOLD}→ ${RESET}"
}

demo_auto() {
  header
  echo -e "  ${YELLOW}▶ Demo automática — simulando entrada en 4 parqueos${RESET}"
  echo ""
  sleep 1

  declare -A LABELS
  LABELS["A-002"]="A · Norte"
  LABELS["A-130"]="A · Oeste"
  LABELS["B-001"]="B · Sur"
  LABELS["B-130"]="B · Este"

  for space in "A-002" "A-130" "B-001" "B-130"; do
    header
    echo -e "  ${YELLOW}▶ Vehículo detectado — Zona ${LABELS[$space]} (espacio $space)${RESET}\n"
    sensor_anim "$space" "OCCUPIED"
    echo -e "  ${DIM}Ver cambio en → http://localhost:3000/parqueo/mapa${RESET}"
    sleep 1.5
  done

  sleep 1

  for space in "A-002" "A-130" "B-001" "B-130"; do
    header
    echo -e "  ${YELLOW}▶ Vehículo salió — Zona ${LABELS[$space]} (espacio $space)${RESET}\n"
    sensor_anim "$space" "AVAILABLE"
    sleep 1
  done

  echo -e "\n  ${GREEN}✓ Demo completa. El mapa refleja los cambios en tiempo real.${RESET}\n"
  sleep 1
}

# ── Main loop ─────────────────────────────────────────────────────────────────
while true; do
  header
  menu
  read -r opt
  case $opt in
    1) header; sensor_anim "A-001" "OCCUPIED";  sleep 2 ;;
    2) header; sensor_anim "A-001" "AVAILABLE"; sleep 2 ;;
    3) header; sensor_anim "B-001" "OCCUPIED";  sleep 2 ;;
    4) header; sensor_anim "B-001" "AVAILABLE"; sleep 2 ;;
    5) demo_auto ;;
    q|Q) echo -e "\n  ${DIM}Hasta luego.${RESET}\n"; exit 0 ;;
    *) ;;
  esac
done
