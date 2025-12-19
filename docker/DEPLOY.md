# Monkeytype.uz Serverga Deploy Qilish Qo'llanmasi

Bu qo'llanma monkeytype.uz domenida Monkeytype ilovasini deploy qilish uchun batafsil ko'rsatmalar beradi.

## Talablar

- Docker va Docker Compose o'rnatilgan bo'lishi kerak
- Serverda root yoki sudo huquqlari
- monkeytype.uz domeni sozlangan bo'lishi kerak
- SSL sertifikati (Let's Encrypt yoki boshqa)

## Variant 1: Docker Hub'dan Rasmiy Imagelarni Ishlatish (Tavsiya etiladi)

Bu eng oson va tez usul. Rasmiy Docker imagelaridan foydalanadi.

### 1-qadam: Serverga ulanish va loyihani yuklash

```bash
# Serverga SSH orqali ulaning
ssh user@your-server

# Loyiha papkasini yarating
mkdir -p ~/monkeytype
cd ~/monkeytype

# Git repositoryni klon qiling (yoki kodlarni yuklang)
git clone https://github.com/monkeytypegame/monkeytype.git .
# YOKI
# Agar kodlarni boshqa usul bilan yuklasangiz, docker papkasini ko'chiring
```

### 2-qadam: Docker papkasiga o'ting

```bash
cd docker
```

### 3-qadam: Environment faylini yarating

```bash
# example.env faylini .env ga nusxalang
cp example.env .env

# .env faylini tahrirlang
nano .env
```

`.env` faylida quyidagilarni to'ldiring:

```env
# Frontend Configuration
HTTP_PORT=80

# Backend Configuration  
BACKEND_PORT=5005

# Domain Configuration for monkeytype.uz
MONKEYTYPE_FRONTENDURL=https://monkeytype.uz
MONKEYTYPE_BACKENDURL=https://api.monkeytype.uz

# Firebase Configuration (kerak bo'lsa)
FIREBASE_APIKEY=your-firebase-api-key
FIREBASE_AUTHDOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECTID=your-project-id
FIREBASE_STORAGEBUCKET=your-project.appspot.com
FIREBASE_MESSAGINGSENDERID=your-sender-id
FIREBASE_APPID=your-app-id

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET=your-recaptcha-secret

# Email Configuration (ixtiyoriy)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM="Monkeytype <noreply@monkeytype.uz>"
```

**Eslatma:** Agar account tizimini yoqmasangiz, Firebase va reCAPTCHA sozlamalarini bo'sh qoldirishingiz mumkin. Lekin production uchun tavsiya etiladi.

### 4-qadam: Docker imagelarni yuklab olish

```bash
# Rasmiy imagelarni yuklab olish
docker compose pull
```

### 5-qadam: Containerlarni ishga tushirish

```bash
# Background rejimda ishga tushirish
docker compose up -d

# Loglarni ko'rish
docker compose logs -f
```

### 6-qadam: Nginx reverse proxy sozlash (SSL bilan)

Agar sizda allaqachon Nginx o'rnatilgan bo'lsa, reverse proxy sozlang:

```nginx
# /etc/nginx/sites-available/monkeytype.uz
server {
    listen 80;
    server_name monkeytype.uz www.monkeytype.uz;
    
    # SSL sertifikatini olish uchun
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # HTTP'dan HTTPS'ga yo'naltirish
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name monkeytype.uz www.monkeytype.uz;

    ssl_certificate /etc/letsencrypt/live/monkeytype.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monkeytype.uz/privkey.pem;

    # Frontend uchun
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API uchun (agar alohida subdomain bo'lsa)
    # location /api/ {
    #     proxy_pass http://localhost:5005;
    #     proxy_http_version 1.1;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    # }
}

# API uchun alohida subdomain (tavsiya etiladi)
server {
    listen 443 ssl http2;
    server_name api.monkeytype.uz;

    ssl_certificate /etc/letsencrypt/live/monkeytype.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monkeytype.uz/privkey.pem;

    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx konfiguratsiyasini faollashtiring:

```bash
sudo ln -s /etc/nginx/sites-available/monkeytype.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7-qadam: SSL sertifikatini olish (Let's Encrypt)

```bash
sudo certbot --nginx -d monkeytype.uz -d www.monkeytype.uz -d api.monkeytype.uz
```

## Variant 2: Lokal Build Qilish

Agar o'zgarishlar qilgan bo'lsangiz yoki rasmiy imagelarni ishlatmoqchi bo'lmasangiz:

### 1-qadam: Kodlarni serverga yuklash

```bash
# Serverga ulaning
ssh user@your-server

# Loyiha papkasini yarating
mkdir -p ~/monkeytype
cd ~/monkeytype

# Kodlarni yuklang (Git, rsync, yoki boshqa usul)
```

### 2-qadam: Docker imagelarni build qilish

```bash
# Root papkada (monkeytype/)
docker buildx build --progress=plain -t monkeytype/monkeytype-backend:latest . -f ./docker/backend/Dockerfile
docker buildx build --progress=plain -t monkeytype/monkeytype-frontend:latest . -f ./docker/frontend/Dockerfile
```

### 3-qadam: Docker Compose bilan ishga tushirish

```bash
cd docker
cp example.env .env
# .env faylini tahrirlang
nano .env

# Containerlarni ishga tushirish
docker compose up -d
```

## Variant 3: Docker Compose Build (Eng Oson)

Docker Compose o'zi build qiladi:

```bash
cd docker

# docker-compose.yml faylini tahrirlang va build qo'shing:
# services:
#   monkeytype-frontend:
#     build:
#       context: ..
#       dockerfile: ./docker/frontend/Dockerfile
#   monkeytype-backend:
#     build:
#       context: ..
#       dockerfile: ./docker/backend/Dockerfile

cp example.env .env
nano .env

docker compose up -d --build
```

## Containerlarni Boshqarish

```bash
# Containerlarni ko'rish
docker compose ps

# Loglarni ko'rish
docker compose logs -f

# Barcha containerlarni to'xtatish
docker compose down

# Containerlarni qayta ishga tushirish
docker compose restart

# Yangi o'zgarishlar bilan qayta build qilish
docker compose up -d --build
```

## Muammolarni Hal Qilish

### Containerlar ishlamayapti

```bash
# Loglarni tekshiring
docker compose logs

# Containerlarni qayta ishga tushiring
docker compose restart

# Barcha containerlarni to'xtatib, qayta ishga tushiring
docker compose down
docker compose up -d
```

### Portlar band

```bash
# Qaysi portlar band ekanligini tekshiring
sudo netstat -tulpn | grep LISTEN

# .env faylida portlarni o'zgartiring
HTTP_PORT=8081
BACKEND_PORT=5006
```

### Database muammolari

```bash
# MongoDB containerini tekshiring
docker compose logs monkeytype-mongodb

# Redis containerini tekshiring
docker compose logs monkeytype-redis
```

## Yangilash

```bash
cd ~/monkeytype/docker

# Yangi imagelarni yuklab olish
docker compose pull

# Containerlarni qayta ishga tushirish
docker compose up -d
```

## Xavfsizlik

1. **Firewall sozlang:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSL sertifikatini yangilash:**
   ```bash
   sudo certbot renew --dry-run
   ```

3. **Muntazam yangilanishlar:**
   ```bash
   docker compose pull
   docker compose up -d
   ```

## Tekshirish

Deploy qilgandan keyin quyidagilarni tekshiring:

1. Frontend: https://monkeytype.uz
2. Backend API: https://api.monkeytype.uz
3. Default til o'zbek tilida ekanligini tekshiring

## Qo'shimcha Ma'lumot

- [SELF_HOSTING.md](../docs/SELF_HOSTING.md) - Batafsil sozlashlar
- [BUILD.md](./BUILD.md) - Build qo'llanmasi
