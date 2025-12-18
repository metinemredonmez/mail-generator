# UZMAN MAIL PANEL - Production Deployment Rehberi

## Domain: mail-service.uzmanumre.com
## Server: 89.252.152.13

---

## 📋 DEPLOYMENT SEÇENEKLERİ

| Seçenek | Avantajlar | Dezavantajlar |
|---------|------------|---------------|
| **Docker Compose** | Kolay kurulum, izole | Daha fazla RAM kullanır |
| **PM2** | Hafif, direkt kontrol | Manuel database kurulumu |

---

## 🔧 AŞAMA 1: SUNUCU HAZIRLIK (Sen yapacaksın)

### 1.1 Temel Paketler
```bash
# Sistem güncelle
sudo apt update && sudo apt upgrade -y

# Temel araçlar
sudo apt install -y curl wget git nano htop
```

### 1.2 Node.js 20 LTS Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kontrol
node --version   # v20.x.x
npm --version
```

### 1.3 Yarn & PM2 Kurulumu
```bash
npm install -g yarn pm2

# Kontrol
yarn --version
pm2 --version
```

### 1.4 Docker Kurulumu (Docker seçeneği için)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install docker-compose-plugin

# User'ı docker grubuna ekle
sudo usermod -aG docker $USER

# Kontrol
docker --version
docker compose version
```

### 1.5 PostgreSQL Kurulumu (PM2 seçeneği için)
```bash
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL'e bağlan
sudo -u postgres psql

# Komutlar:
CREATE USER mailpanel_user WITH PASSWORD 'guclu_sifre_buraya';
CREATE DATABASE mailpanel_prod OWNER mailpanel_user;
GRANT ALL PRIVILEGES ON DATABASE mailpanel_prod TO mailpanel_user;
\q
```

### 1.6 Redis Kurulumu (PM2 seçeneği için)
```bash
sudo apt install -y redis-server

# Şifre ayarla
sudo nano /etc/redis/redis.conf
# requirepass redis_sifre_buraya

sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

### 1.7 Firewall Ayarları
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 📦 AŞAMA 2: PROJE TRANSFER

### Seçenek A: SCP ile (Önerilen)
```bash
# Lokal makinede çalıştır:
cd ~/Desktop
scp -r mail-generator root@89.252.152.13:/var/www/
```

### Seçenek B: Git ile
```bash
# Sunucuda:
cd /var/www
git clone https://github.com/YOUR_REPO/mail-generator.git
```

### Seçenek C: FileZilla/SFTP
- Host: 89.252.152.13
- User: root
- Port: 22
- Hedef: /var/www/mail-generator

---

## 🐳 AŞAMA 3A: DOCKER DEPLOYMENT (Önerilen)

```bash
cd /var/www/mail-generator

# Environment ayarları
nano backend/.env.production
# DATABASE_URL içinde 'postgres' yerine 'postgres' bırak (container adı)
# Diğer değerleri kontrol et

# Deploy
chmod +x deploy.sh
./deploy.sh
# Seçenek 1'i seç (Docker)

# Kontrol
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## ⚙️ AŞAMA 3B: PM2 DEPLOYMENT

```bash
cd /var/www/mail-generator

# Backend ENV ayarla
cd backend
cp .env.production .env
nano .env
# DATABASE_URL'de localhost kullan
# REDIS_HOST'u localhost yap
```

**Güncellenecek değerler:**
```env
DATABASE_URL=postgresql://mailpanel_user:SIFRE@localhost:5432/mailpanel_prod?schema=public
REDIS_HOST=localhost
REDIS_PASSWORD=REDIS_SIFRESI
JWT_SECRET=openssl_rand_base64_32_ile_olustur
```

```bash
# Devam
yarn install
npx prisma generate
npx prisma migrate deploy
yarn build

# Frontend
cd ../frontend
cp .env.production .env.local
yarn install
yarn build

# PM2 ile başlat
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🌐 AŞAMA 4: CYBERPANEL / NGINX AYARI

### CyberPanel ile:
1. **Website Oluştur**: CyberPanel > Websites > Create Website
   - Domain: mail-service.uzmanumre.com
   - PHP: Disabled / Pure Static

2. **vHost Conf Düzenle**: Websites > List > mail-service.uzmanumre.com > vHost Conf
```nginx
# /api için backend proxy
location /api {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300;
}

# Frontend proxy
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

3. **SSL Sertifikası**: SSL > mail-service.uzmanumre.com > Issue SSL

### Nginx ile (CyberPanel yoksa):
```bash
sudo cp /var/www/mail-generator/infra/nginx/mailpanel.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/mailpanel.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mail-service.uzmanumre.com
```

---

## ✅ AŞAMA 5: TEST & DOĞRULAMA

### Servis Kontrolleri
```bash
# PM2
pm2 status
pm2 logs

# Docker
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs

# Port kontrol
netstat -tlnp | grep -E '(3001|4000)'
```

### API Test
```bash
# Health check
curl http://localhost:4000/api/health

# Dışarıdan
curl https://mail-service.uzmanumre.com/api/health
```

### Browser Test
- https://mail-service.uzmanumre.com açılmalı
- Login sayfası görünmeli

---

## 🔐 İLK GİRİŞ

**Admin hesabı oluştur:**
```bash
cd /var/www/mail-generator/backend
npx prisma db seed
```

**Varsayılan giriş:**
- Email: admin@mailpanel.com
- Password: admin123

**⚠️ ÖNEMLİ:** İlk girişten sonra şifreyi değiştir!

---

## 🔄 GÜNCELLEME

```bash
cd /var/www/mail-generator
git pull origin main

# Docker
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# PM2
cd backend && yarn install && yarn build
cd ../frontend && yarn install && yarn build
pm2 restart all
```

---

## 🐛 SORUN GİDERME

### Loglar
```bash
# PM2
pm2 logs mailpanel-backend --lines 100
pm2 logs mailpanel-frontend --lines 100

# Docker
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### Yaygın Hatalar

| Hata | Çözüm |
|------|-------|
| 502 Bad Gateway | Backend/Frontend çalışmıyor, `pm2 status` kontrol et |
| CORS Error | Backend .env'de CORS_ORIGINS kontrol et |
| Database Connection | DATABASE_URL kontrol et, PostgreSQL çalışıyor mu |
| Redis Connection | Redis servisi çalışıyor mu, şifre doğru mu |

---

## 📞 URL'ler

| Servis | URL |
|--------|-----|
| Frontend | https://mail-service.uzmanumre.com |
| API | https://mail-service.uzmanumre.com/api |
| Health | https://mail-service.uzmanumre.com/api/health |
| Swagger | https://mail-service.uzmanumre.com/api/docs |
