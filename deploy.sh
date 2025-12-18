#!/bin/bash

# ============================================
# UZMAN MAIL PANEL - DEPLOYMENT SCRIPT
# ============================================

set -e  # Hata durumunda dur

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
echo ""
echo "============================================"
echo "   UZMAN MAIL PANEL - DEPLOYMENT"
echo "   mail-service.uzmanumre.com"
echo "============================================"
echo ""

# Deployment modu sec
echo "Deployment modu secin:"
echo "1) Docker Compose (Onerilen)"
echo "2) PM2 (Manuel kurulum)"
echo "3) Sadece Build"
read -p "Seciminiz (1/2/3): " DEPLOY_MODE

# Proje dizini
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Logs dizini olustur
mkdir -p "$PROJECT_DIR/logs"

case $DEPLOY_MODE in
    1)
        # ============================================
        # DOCKER COMPOSE DEPLOYMENT
        # ============================================
        log "Docker Compose deployment basliyor..."

        # Docker kontrol
        if ! command -v docker &> /dev/null; then
            error "Docker kurulu degil! Lutfen docker kurun."
        fi

        if ! command -v docker-compose &> /dev/null; then
            error "Docker Compose kurulu degil!"
        fi

        # Eski containerlari durdur
        log "Eski containerlar durduruluyor..."
        docker-compose -f docker-compose.prod.yml down --remove-orphans || true

        # Build ve baslat
        log "Docker imajlari build ediliyor..."
        docker-compose -f docker-compose.prod.yml build --no-cache

        log "Containerlar baslatiliyor..."
        docker-compose -f docker-compose.prod.yml up -d

        # Database migration
        log "Database migration calistiriliyor..."
        sleep 10  # PostgreSQL'in baslamasini bekle
        docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

        log "Docker deployment tamamlandi!"
        echo ""
        docker-compose -f docker-compose.prod.yml ps
        ;;

    2)
        # ============================================
        # PM2 DEPLOYMENT
        # ============================================
        log "PM2 deployment basliyor..."

        # Node.js kontrol
        if ! command -v node &> /dev/null; then
            error "Node.js kurulu degil!"
        fi

        # PM2 kontrol
        if ! command -v pm2 &> /dev/null; then
            warn "PM2 kurulu degil, kuruluyor..."
            npm install -g pm2
        fi

        # Eski processleri durdur
        log "Eski PM2 processleri durduruluyor..."
        pm2 delete mailpanel-backend mailpanel-frontend 2>/dev/null || true

        # Backend
        log "Backend build ediliyor..."
        cd "$BACKEND_DIR"

        # .env.production kontrolu
        if [ ! -f ".env.production" ]; then
            error ".env.production dosyasi bulunamadi!"
        fi

        # .env.production'i .env olarak kopyala
        cp .env.production .env

        yarn install --frozen-lockfile
        yarn build

        # Database migration
        log "Database migration calistiriliyor..."
        npx prisma generate
        npx prisma migrate deploy

        # Frontend
        log "Frontend build ediliyor..."
        cd "$FRONTEND_DIR"

        if [ ! -f ".env.production" ]; then
            error "Frontend .env.production dosyasi bulunamadi!"
        fi

        cp .env.production .env.local

        yarn install --frozen-lockfile
        yarn build

        # PM2 ile baslat
        log "PM2 ile uygulamalar baslatiliyor..."
        cd "$PROJECT_DIR"
        pm2 start ecosystem.config.js --env production

        # PM2 startup
        log "PM2 startup ayarlaniyor..."
        pm2 save

        log "PM2 deployment tamamlandi!"
        echo ""
        pm2 status
        ;;

    3)
        # ============================================
        # SADECE BUILD
        # ============================================
        log "Build basliyor..."

        # Backend build
        log "Backend build ediliyor..."
        cd "$BACKEND_DIR"
        yarn install --frozen-lockfile
        yarn build
        log "Backend build tamamlandi!"

        # Frontend build
        log "Frontend build ediliyor..."
        cd "$FRONTEND_DIR"
        yarn install --frozen-lockfile
        yarn build
        log "Frontend build tamamlandi!"

        log "Build islemleri tamamlandi!"
        ;;

    *)
        error "Gecersiz secim!"
        ;;
esac

echo ""
echo "============================================"
echo "   DEPLOYMENT TAMAMLANDI!"
echo "============================================"
echo ""
echo "Frontend: https://mail-service.uzmanumre.com"
echo "Backend API: https://mail-service.uzmanumre.com/api"
echo "Health Check: https://mail-service.uzmanumre.com/api/health"
echo ""
