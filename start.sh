#!/usr/bin/env bash
# ==============================================================================
# Fitness Microservices Platform — One-Touch Docker Startup Script
# ==============================================================================
# Zero local host dependencies required except Docker!
# Builds all services via multi-stage Dockerfiles and orchestrates startup.
# ==============================================================================

set -eo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}===================================================================${NC}"
echo -e "${BOLD}${CYAN}      Fitness Microservices Platform — 100% Docker Launcher        ${NC}"
echo -e "${BOLD}${CYAN}===================================================================${NC}"

# ------------------------------------------------------------------------------
# 1. Check Docker & Docker Compose
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[1/5] Checking Docker Environment...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Error: Docker is not installed on this system.${NC}"
  echo -e "Please install Docker from: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo -e "${RED}❌ Error: Docker daemon is not running.${NC}"
  echo -e "Please start Docker Desktop or run: sudo systemctl start docker"
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Error: Docker Compose plugin is not installed.${NC}"
  echo -e "Please install docker-compose-v2: https://docs.docker.com/compose/install/"
  exit 1
fi

echo -e "${GREEN}✓ Docker is running: $(docker --version)${NC}"
echo -e "${GREEN}✓ Docker Compose is ready: $(docker compose version)${NC}"

# ------------------------------------------------------------------------------
# 2. Check and Configure .env File
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[2/5] Checking Environment Configuration (.env)...${NC}"

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Creating default .env file...${NC}"
  cat << 'EOF' > "$ENV_FILE"
REGISTRY_PREFIX=
IMAGE_TAG=latest
DB_PASSWORD=rohith
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
FRONTEND_PORT=5173
GEMINI_KEY=demo_key
EOF
fi

# Check for GEMINI_KEY
CURRENT_GEMINI_KEY=$(grep -E '^GEMINI_KEY=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '[:space:]"' || true)

if [ -z "$CURRENT_GEMINI_KEY" ] || [ "$CURRENT_GEMINI_KEY" = "demo_key" ]; then
  echo -e "\n${YELLOW}🔑 Google Gemini API Key required for AI Workout Recommendations.${NC}"
  echo -e "   (Get a free key at: https://aistudio.google.com/app/apikey)"
  if [ -t 0 ]; then
    read -r -p "Enter your GEMINI_KEY (or press Enter to use 'demo_key'): " USER_GEMINI_KEY
    if [ -n "$USER_GEMINI_KEY" ]; then
      sed -i.bak -e "s|^GEMINI_KEY=.*|GEMINI_KEY=$USER_GEMINI_KEY|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
      echo -e "${GREEN}✓ Saved GEMINI_KEY to .env${NC}"
    fi
  else
    echo -e "${YELLOW}Running in non-interactive mode; defaulting to demo_key.${NC}"
  fi
fi

# Ensure required default keys exist in .env
grep -q '^DB_PASSWORD=' "$ENV_FILE" || echo "DB_PASSWORD=rohith" >> "$ENV_FILE"
grep -q '^KEYCLOAK_ADMIN=' "$ENV_FILE" || echo "KEYCLOAK_ADMIN=admin" >> "$ENV_FILE"
grep -q '^KEYCLOAK_ADMIN_PASSWORD=' "$ENV_FILE" || echo "KEYCLOAK_ADMIN_PASSWORD=admin" >> "$ENV_FILE"
grep -q '^FRONTEND_PORT=' "$ENV_FILE" || echo "FRONTEND_PORT=5173" >> "$ENV_FILE"
grep -q '^REGISTRY_PREFIX=' "$ENV_FILE" || echo "REGISTRY_PREFIX=" >> "$ENV_FILE"
grep -q '^IMAGE_TAG=' "$ENV_FILE" || echo "IMAGE_TAG=latest" >> "$ENV_FILE"

echo -e "${GREEN}✓ Configuration verified in .env${NC}"

# ------------------------------------------------------------------------------
# 3. Build & Launch Containers
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[3/5] Building & Launching Microservices Stack via Docker Compose...${NC}"
echo -e "${CYAN}Building images from source (Zero local Java/Node required)...${NC}"

docker compose -f docker-compose.prod.yml up -d --build

# ------------------------------------------------------------------------------
# 4. Wait for Keycloak & Gateway Health
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[4/5] Waiting for Services to Initialize & Pass Health Checks...${NC}"

# A. Wait for Keycloak
echo -n "Waiting for Keycloak Authentication Server..."
KEYCLOAK_READY=false
for i in {1..40}; do
  if curl -s -f http://localhost:8080/realms/fitness-app > /dev/null 2>&1; then
    KEYCLOAK_READY=true
    break
  fi
  echo -n "."
  sleep 3
done

if [ "$KEYCLOAK_READY" = true ]; then
  echo -e " ${GREEN}[READY]${NC}"
  # Ensure local redirect URIs and master realm SSL are configured
  docker exec fitness-keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin > /dev/null 2>&1 || true
  docker exec fitness-keycloak /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE > /dev/null 2>&1 || true
else
  echo -e " ${YELLOW}[Slow start - continuing]${NC}"
fi

# B. Wait for API Gateway
echo -n "Waiting for Spring Cloud API Gateway..."
GATEWAY_READY=false
for i in {1..40}; do
  if curl -s -f http://localhost:8086/actuator/health > /dev/null 2>&1; then
    GATEWAY_READY=true
    break
  fi
  echo -n "."
  sleep 3
done

if [ "$GATEWAY_READY" = true ]; then
  echo -e " ${GREEN}[READY]${NC}"
else
  echo -e " ${YELLOW}[JVM still booting - will be ready in ~30s]${NC}"
fi

# ------------------------------------------------------------------------------
# 5. Display Live Access Dashboard
# ------------------------------------------------------------------------------
FRONTEND_PORT=$(grep -E '^FRONTEND_PORT=' "$ENV_FILE" | cut -d'=' -f2 | tr -d '[:space:]"' || echo "5173")
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo -e "\n${BOLD}${GREEN}===================================================================${NC}"
echo -e "${BOLD}${GREEN}  🚀 FITNESS MICROSERVICES PLATFORM IS RUNNING!                     ${NC}"
echo -e "${BOLD}${GREEN}===================================================================${NC}"
echo -e ""
echo -e "  🌐 ${BOLD}React Frontend:${NC}       ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  🔐 ${BOLD}Keycloak Admin:${NC}       ${CYAN}http://localhost:8080/admin/${NC} (admin / admin)"
echo -e "  🚪 ${BOLD}API Gateway:${NC}          ${CYAN}http://localhost:8086/actuator/health${NC}"
echo -e "  🔍 ${BOLD}Eureka Dashboard:${NC}     ${CYAN}http://localhost:8761${NC}"
echo -e ""
echo -e "  📋 ${BOLD}To view container status:${NC}  docker compose -f docker-compose.prod.yml ps"
echo -e "  📜 ${BOLD}To view live logs:${NC}         docker compose -f docker-compose.prod.yml logs -f"
echo -e "  🛑 ${BOLD}To stop all services:${NC}      ./stop.sh"
echo -e "${BOLD}${GREEN}===================================================================${NC}\n"
