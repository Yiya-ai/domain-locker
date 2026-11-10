#!/bin/bash
set -e

################################################################################
# Domain Locker - A self-hosted domain management tool                         #
#                                                                              #
# To install Domain Locker with Docker, download and execute this script       #
# Alternatively, download and use our docker-compose.yml as a template:        #
# https://github.com/Lissy93/domain-locker/blob/main/docker-compose.yml        #
#                                                                              #
# Domain Locker is licensed under the MIT License. (C) Alicia Sykes 2025       #
# View source on GitHub, at: https://github.com/Lissy93/domain-locker          #
################################################################################

# 1. Check Docker is installed
command -v docker >/dev/null || {
  echo "❌ Docker is not installed. Get it from https://docs.docker.com/get-docker/"
  exit 1
}

cd -- "$(dirname -- "$0")"
test -f docker-compose.yml || { echo "Use the local Domain Locker source checkout."; exit 1; }
docker compose up --build --wait -d
