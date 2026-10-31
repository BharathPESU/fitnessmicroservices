#!/usr/bin/env bash
# ==============================================================================
# Fitness Microservices Platform — Shutdown Script
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}Stopping Fitness Microservices Platform...${NC}"

if [ "$1" = "--clean" ] || [ "$1" = "-v" ]; then
  echo -e "${YELLOW}Stopping containers and removing volumes (Data wipe)...${NC}"
  docker compose -f docker-compose.prod.yml down -v
  echo -e "${GREEN}✓ All containers, networks, and data volumes removed.${NC}"
else
  docker compose -f docker-compose.prod.yml down
  echo -e "${GREEN}✓ All services stopped safely (Data preserved in volumes).${NC}"
  echo -e "Tip: Run './stop.sh --clean' if you wish to reset all database volumes."
fi
