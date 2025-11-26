#!/bin/bash
# ============================================
# UZMAN MAIL PANEL - Setup Script
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================"
echo "  UZMAN MAIL PANEL - Kurulum"
echo "============================================"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker yuklu degil!"
    exit 1
fi
print_success "Docker mevcut"

# Check infra
INFRA_DIR="$HOME/Desktop/infra"
if [ ! -d "$INFRA_DIR" ]; then
    print_error "Infra klasoru bulunamadi: $INFRA_DIR"
    exit 1
fi

# Start infra
print_status "Infra servisleri baslatiliyor..."
cd "$INFRA_DIR"
docker compose up -d
sleep 5
print_success "PostgreSQL ve Redis baslatildi"

# Back to project
cd "$HOME/Desktop/mail-generator"

# Backend
print_status "Backend bagimliliklari yukleniyor..."
cd backend
npm install

print_status "Prisma migration..."
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init

print_status "Prisma generate..."
npx prisma generate

print_status "Seed verileri..."
npx prisma db seed 2>/dev/null || print_warning "Seed mevcut"

# Frontend
print_status "Frontend bagimliliklari..."
cd ../frontend
npm install

echo ""
echo "============================================"
echo -e "${GREEN}  KURULUM TAMAMLANDI!${NC}"
echo "============================================"
echo ""
echo "Backend:  cd backend && npm run start:dev"
echo "Frontend: cd frontend && npm run dev"
echo ""
echo "http://localhost:3001 - Frontend"
echo "http://localhost:4000/api - Backend"
echo ""
echo "Admin: admin@mailpanel.com / admin123"
