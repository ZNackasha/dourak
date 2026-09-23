#!/usr/bin/env bash
#
# One-time setup for a fresh Debian 12 e2-micro VM. Run as a sudo-capable user.
# The VM has only 1 GB of RAM, so swap is required for Keycloak to start reliably.
set -euo pipefail

if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf >/dev/null
sudo sysctl --system >/dev/null

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Log out and back in, then run: docker compose up -d --build"
fi
