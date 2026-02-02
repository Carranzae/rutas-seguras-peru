# 📚 Ruta Segura Perú - Documentación Técnica

Bienvenido a la documentación oficial del proyecto **Ruta Segura Perú**, una plataforma integral de seguridad turística.

## 📖 Índice de Documentación

| Documento | Descripción |
|-----------|-------------|
| [README.md](./README.md) | Este archivo - Índice general |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura del sistema y diagramas |
| [INSTALLATION.md](./INSTALLATION.md) | Guía de instalación paso a paso |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Configuración de PostgreSQL |
| [BACKEND.md](./BACKEND.md) | API Backend (FastAPI) |
| [SUPER_ADMIN.md](./SUPER_ADMIN.md) | Panel Super Administrador |
| [AGENCY_WEB.md](./AGENCY_WEB.md) | Dashboard de Agencias |
| [MOBILE_APP.md](./MOBILE_APP.md) | Aplicación Móvil (React Native/Expo) |
| [API_REFERENCE.md](./API_REFERENCE.md) | Referencia completa de endpoints |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Solución de errores comunes |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guía de despliegue a producción |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | Integraciones externas (GhosCloud, Vonage, etc.) |

---

## 🎯 Objetivo del Proyecto

**Ruta Segura Perú** es una plataforma de seguridad turística que conecta:

- **Turistas**: Viajeros que necesitan seguridad y asistencia
- **Guías**: Profesionales certificados que lideran tours
- **Agencias**: Empresas turísticas registradas
- **Super Admin**: Operador central de la plataforma

### Funcionalidades Principales

| Módulo | Descripción |
|--------|-------------|
| 🆘 **SOS Emergencias** | Botón de pánico con geolocalización en tiempo real |
| 📍 **GPS Tracking** | Seguimiento en vivo de guías y turistas |
| 🔐 **Verificación de Identidad** | Validación biométrica y antecedentes (GhosCloud) |
| 💳 **Pagos Integrados** | Procesamiento con Izipay |
| 🌐 **Traductor en Tiempo Real** | Comunicación multilingüe |
| 📱 **App Móvil** | Disponible para turistas y guías |
| 🖥️ **Dashboards Web** | Paneles de control para agencias y super admin |

---

## 🏗️ Estructura del Proyecto

```
ruta-segura-peru/
├── apps/                    # Aplicaciones
│   ├── mobile/              # App React Native (Expo)
│   ├── super-admin/         # Panel Next.js Super Admin
│   └── agency-web/          # Dashboard Next.js Agencias
├── backend/                 # API FastAPI (Python)
├── packages/                # Paquetes compartidos
│   ├── shared-types/        # TypeScript types
│   └── ui/                  # Componentes UI
├── docs/                    # Documentación (este directorio)
├── infrastructure/          # Configuración de infraestructura
└── scripts/                 # Scripts de utilidad
```

---

## 🚀 Inicio Rápido

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd ruta-segura-peru

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
# Ver DATABASE_SETUP.md

# 4. Configurar variables de entorno
cp backend/.env.example backend/.env

# 5. Iniciar servicios
# Windows: Doble click en START_ALL.bat
# O manualmente:
cd backend && python -m uvicorn app.main:app --reload
cd apps/super-admin && npm run dev
cd apps/mobile && npx expo start
```

---

## 📞 Contacto y Soporte

Para dudas técnicas, revisar [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

*Última actualización: Febrero 2026*
