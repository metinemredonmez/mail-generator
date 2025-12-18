# Shared Infrastructure

Tum projeler icin ortak PostgreSQL ve Redis servisleri.

## Servisler

| Servis | Port | Aciklama |
|--------|------|----------|
| PostgreSQL | 5432 | Ana veritabani |
| Redis | 6379 | Cache & session |
| Adminer | 8080 | PostgreSQL yonetimi |
| Redis Commander | 8081 | Redis yonetimi |

## Kullanim

```bash
# Baslat
cd ~/Desktop/infra
docker-compose up -d

# Durdur
docker-compose down

# Loglar
docker-compose logs -f
```

## Veritabanlari

| Database | User | Password | Proje |
|----------|------|----------|-------|
| mailpanel | mailpanel | mailpanel123 | Uzman Mail Panel |
| podcast_app | podcast | podcast123 | Podcast App |
| tourism_app | tourism | tourism123 | Tourism App |

## Baglanti Bilgileri

### PostgreSQL
```
Host: localhost
Port: 5432
User: postgres (admin) veya proje user'i
Password: postgres123 (admin) veya proje password'u
```

### Redis
```
Host: localhost
Port: 6379
Password: redis123
```
