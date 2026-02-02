# 🚀 Guía de Despliegue

Instrucciones para desplegar Ruta Segura Perú en producción.

---

## Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│     CDN (Vercel/Cloudflare)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                             │
│                    (Nginx / AWS ALB)                         │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Backend #1    │ │   Backend #2    │ │   Backend #3    │
│   (FastAPI)     │ │   (FastAPI)     │ │   (FastAPI)     │
│   Gunicorn      │ │   Gunicorn      │ │   Gunicorn      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
         ┌───────────────────────────────────────┐
         │             PostgreSQL                 │
         │         (RDS / Cloud SQL)             │
         └───────────────────────────────────────┘
                             │
         ┌───────────────────────────────────────┐
         │               Redis                    │
         │         (ElastiCache)                 │
         └───────────────────────────────────────┘
```

---

## Opción 1: Docker Compose (VPS Simple)

### 1.1 Preparar Servidor

```bash
# Ubuntu 22.04
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx certbot python3-certbot-nginx -y
```

### 1.2 Clonar Repositorio

```bash
git clone <repository-url> /opt/ruta-segura
cd /opt/ruta-segura
```

### 1.3 Configurar Variables

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

**Variables críticas para producción**:
```env
APP_ENV=production
DEBUG=false

# Base de datos
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/ruta_segura_peru

# Seguridad - CAMBIAR OBLIGATORIO
JWT_SECRET_KEY=<generar-clave-segura-64-chars>

# Redis
REDIS_URL=redis://redis:6379/0

# CORS - Solo dominios de producción
CORS_ORIGINS=["https://admin.rutaseguraperu.com","https://agency.rutaseguraperu.com"]
```

### 1.4 Generar Clave JWT Segura

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 1.5 Iniciar con Docker Compose

```bash
docker-compose up -d
```

### 1.6 Configurar Nginx

```nginx
# /etc/nginx/sites-available/rutasegura

server {
    listen 80;
    server_name api.rutaseguraperu.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name admin.rutaseguraperu.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 1.7 SSL con Let's Encrypt

```bash
sudo certbot --nginx -d api.rutaseguraperu.com -d admin.rutaseguraperu.com
```

---

## Opción 2: Vercel + Railway

### Backend en Railway

1. Crear cuenta en [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Agregar variables de entorno
4. Railway crea PostgreSQL y Redis automáticamente

### Frontend en Vercel

1. Importar repositorio en Vercel
2. Root Directory: `apps/super-admin`
3. Framework: Next.js
4. Variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.railway.app
   ```

---

## Opción 3: AWS (Producción Completa)

### Servicios Requeridos

| Servicio | Uso |
|----------|-----|
| EC2 / ECS | Backend containers |
| RDS | PostgreSQL |
| ElastiCache | Redis |
| S3 | Archivos/imágenes |
| CloudFront | CDN |
| Route 53 | DNS |
| ACM | SSL |
| ALB | Load balancer |

### Terraform (Infraestructura como Código)

```hcl
# infrastructure/main.tf
resource "aws_db_instance" "postgres" {
  identifier           = "rutasegura-db"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  db_name              = "ruta_segura_peru"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = false
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "rutasegura-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
}
```

---

## Mobile App

### Android (Play Store)

```bash
cd apps/mobile

# Build APK signed
npx expo build:android -t app-bundle

# Subir a Play Console
```

### iOS (App Store)

```bash
# Requiere Mac con Xcode
npx expo build:ios

# Subir a App Store Connect
```

### Expo EAS Build (Recomendado)

```bash
npm install -g eas-cli
eas login
eas build -p android
eas build -p ios
```

---

## Checklist Pre-Producción

### Seguridad
- [ ] JWT_SECRET_KEY cambiado (mínimo 64 chars)
- [ ] DEBUG=false
- [ ] CORS configurado solo para dominios permitidos
- [ ] Rate limiting activado
- [ ] HTTPS obligatorio

### Base de Datos
- [ ] Backups automatizados configurados
- [ ] Usuario con permisos mínimos
- [ ] Conexiones SSL habilitadas

### Monitoreo
- [ ] Logs centralizados (CloudWatch, Papertrail)
- [ ] Alertas configuradas (Sentry, PagerDuty)
- [ ] Métricas de rendimiento

### Pruebas
- [ ] Tests pasando en CI/CD
- [ ] Pruebas de carga realizadas
- [ ] Pruebas de seguridad (OWASP)

---

## Mantenimiento

### Backup de Base de Datos

```bash
# Manual
pg_dump -U postgres ruta_segura_peru > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U postgres ruta_segura_peru < backup_20240101.sql
```

### Actualizar Aplicación

```bash
cd /opt/ruta-segura
git pull
docker-compose build
docker-compose up -d
```

### Logs

```bash
# Backend
docker-compose logs -f backend

# Nginx
tail -f /var/log/nginx/access.log
```

---

## Estimación de Costos (AWS)

| Servicio | Especificación | Costo/mes |
|----------|----------------|-----------|
| EC2 | t3.small x2 | ~$30 |
| RDS | db.t3.micro | ~$15 |
| ElastiCache | cache.t3.micro | ~$12 |
| ALB | - | ~$20 |
| S3 + CloudFront | 50GB | ~$5 |
| **Total estimado** | | **~$80/mes** |

*Para Railway/Vercel: ~$20-40/mes (plan Pro)*
