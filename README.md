# Ruta Segura Perú 🛡️🇵🇪

**Safe Tourism & Emergency Response Platform for Peru**

Enterprise-grade mobile, web, and backend solution for tourist safety tracking, emergency response, and real-time guide coordination with native TurboModule support and cloud-native architecture.

---

## 📋 Project Overview

### Vision
Protect tourists in Peru with real-time GPS tracking, emergency SOS alerts, biometric authentication, and AI-powered guide verification.

### Key Features
- 📍 **Real-time GPS Tracking** - Adaptive tracking for low-bandwidth areas
- 🚨 **Emergency SOS System** - One-tap emergency alerts with location sharing
- 👤 **Biometric Authentication** - Fingerprint & facial recognition for tourist & guide identity
- 🗺️ **Interactive Maps** - Mapbox integration with 3D terrain visualization
- 💳 **Payment Processing** - Izipay integration for tour bookings
- 🌐 **Multi-language Support** - Spanish, English, French, Portuguese
- 👨‍💼 **Agency Dashboard** - Tour management & guide oversight
- 🔐 **Guide Verification** - Document verification & background checks

---

## 🏗️ Architecture

### Technology Stack

#### Frontend (Mobile)
- **Framework**: React Native 0.76.9 with Expo 52
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Maps**: Mapbox (react-native-maps)
- **Biometrics**: expo-local-authentication
- **Location**: expo-location with adaptive GPS tracking
- **Build System**: EAS (Expo Application Services) - Cloud-native compilation

#### Frontend (Web)
- **Framework**: Next.js 14
- **UI**: TailwindCSS + Shadcn/ui
- **Admin Dashboard**: Super Admin interface with TypeScript
- **Agency Management**: Agency-specific dashboard

#### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with PostGIS (geospatial queries)
- **Cache**: Redis (hot data for GPS tracking)
- **Authentication**: JWT with refresh tokens
- **Payment**: Izipay (Peruvian payment gateway)
- **Email**: SendGrid for notifications

#### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Management**: npm workspaces (monorepo)
- **Version Control**: Git with semantic commits
- **CI/CD**: GitHub Actions + EAS Cloud Build

---

## 📁 Project Structure

```
ruta-segura-peru/
├── apps/
│   ├── mobile/                    # React Native mobile app (Expo)
│   │   ├── src/
│   │   │   ├── core/             # API, authentication, errors
│   │   │   ├── features/         # Auth, tourist, guide, emergency modules
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── hooks/            # Custom hooks (GPS, biometrics, offline)
│   │   │   ├── config/           # Configuration files
│   │   │   └── i18n/             # Internationalization
│   │   ├── app/                   # Expo Router app directory
│   │   ├── assets/                # Images, icons, fonts
│   │   ├── metro.config.js        # Metro bundler config (monorepo support)
│   │   ├── eas.json               # EAS Build configuration
│   │   └── app.json               # Expo app manifest
│   │
│   ├── agency-web/                # Agency management web app (Next.js)
│   │   └── src/
│   │
│   └── super-admin/               # Admin dashboard (Next.js)
│       └── src/
│
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py               # FastAPI entry point
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Business logic (auth, payments, GPS)
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Auth, logging, error handling
│   │   └── utils/                # Helper functions
│   ├── alembic/                  # Database migrations
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment template
│
├── packages/
│   └── shared-types/              # Shared TypeScript types (monorepo)
│
├── docker-compose.yml             # PostgreSQL, Redis, Backend services
├── package.json                   # Root package.json (workspaces)
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.0.0
- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional but recommended)
- Expo Account (for EAS Build)

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/Carranzae/rutas-seguras-peru.git
cd ruta-segura-peru
```

#### 2. Backend Setup
```bash
# Start PostgreSQL & Redis
docker-compose up -d

# Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start backend (runs on port 8000)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup
```bash
# Root installation (from project root)
npm install --legacy-peer-deps

# Mobile app
cd apps/mobile
npm run start

# Web apps (in separate terminal)
cd apps/agency-web
npm run dev

# OR
cd apps/super-admin
npm run dev
```

---

## 📱 Mobile App Deployment

### Build with EAS (Cloud-Native)

#### First Time Setup
```bash
cd apps/mobile

# Login to Expo
npx eas login

# Configure project
npx eas build:configure
```

#### Build APK for Testing
```bash
# Development build (faster)
npx eas build --platform android --profile development --wait

# Production build (optimized)
npx eas build --platform android --profile preview --wait
```

#### Build for iOS (requires Mac)
```bash
npx eas build --platform ios --profile preview --wait
```

---

## 🔧 Key Changes & Fixes (February 2026)

### Resolved Issues

#### 1. PlatformConstants TurboModule Error (✅ FIXED)
**Problem**: React Native native modules not linking correctly in monorepo
```
[runtime not ready]: Invariant Violation:
TurboModule Registry.getEnforcing(...):
'Platform Constants' could not be found.
```

**Root Cause**: 
- Dependency hoisting moving react-native to root node_modules
- Metro not properly resolving native modules in monorepo
- Missing extraNodeModules configuration

**Solution Implemented**:
- ✅ Enhanced `metro.config.js` with `extraNodeModules` mapping for React Native modules
- ✅ Extended `nohoist` rules in root `package.json` to prevent incorrect dependency hoisting
- ✅ Clean `expo prebuild --clean` regeneration of native code
- ✅ Removed invalid `edgeToEdgeEnabled` property from `app.json`
- ✅ Rebuilt with EAS cloud compilation

**Files Modified**:
- `apps/mobile/metro.config.js` - Added pinned module resolution
- `package.json` - Extended nohoist patterns for `react-native-*` and `@react-native/**`
- `apps/mobile/app.json` - Removed incompatible Android properties
- `apps/mobile/eas.json` - Configured APK build profiles

#### 2. Backend Connectivity (✅ FIXED)
**Problem**: APK couldn't connect to FastAPI backend
- APK was hardcoded to `http://192.168.48.174:8000`
- Mobile device must be on same Wi-Fi as development PC

**Solution**:
- ✅ Updated `apps/mobile/src/core/api/config.ts` to use correct IP
- ✅ Verified PostgreSQL + Redis services running
- ✅ Tested API endpoints at `http://localhost:8000/docs`

#### 3. Monorepo Configuration (✅ OPTIMIZED)
**Improvements**:
- ✅ Configured npm workspaces with proper nohoist patterns
- ✅ Set up Metro to watch multiple workspace directories
- ✅ Implemented `disableHierarchicalLookup` for predictable module resolution

---

## 📋 Configuration Files

### `metro.config.js` - Metro Bundler for Monorepo
```javascript
// Resolves React Native modules correctly in monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

config.resolver.extraNodeModules = {
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    'expo': path.resolve(projectRoot, 'node_modules/expo'),
    '@react-native': path.resolve(projectRoot, 'node_modules/@react-native'),
    'react-native-maps': path.resolve(projectRoot, 'node_modules/react-native-maps'),
    // ... other native modules pinned
};

config.resolver.disableHierarchicalLookup = true;
```

### `eas.json` - Cloud Build Configuration
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleDebug" }
    },
    "preview": {
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleRelease" }
    },
    "production": {
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleRelease" }
    }
  }
}
```

### `package.json` - Monorepo Workspaces
```json
{
  "workspaces": {
    "packages": ["apps/*", "packages/*"],
    "nohoist": [
      "**/react-native/**",
      "**/@react-native/**",
      "**/react-native-*/**",
      "**/expo/**",
      "**/@expo/**"
    ]
  }
}
```

---

## 🛠️ Development Scripts

### Root Level
```bash
npm start                 # Start all apps (mobile + web admin + web agency)
npm run dev:mobile       # Start only mobile with hot reload
npm run dev:admin        # Start super-admin dashboard
npm run dev:agency       # Start agency dashboard
npm run build            # Build all apps
npm run clean            # Remove all node_modules and caches
```

### Mobile Specific
```bash
cd apps/mobile
npx expo start           # Start Metro dev server
npx expo start --clear   # Start with cleared cache
npx expo run:android     # Run on Android device/emulator (requires SDK)
npx expo run:ios         # Run on iOS device/emulator (Mac only)
npx expo prebuild --clean # Regenerate native code
npx eas build --platform android --profile preview --wait
```

### Backend Specific
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔐 Environment Configuration

### Backend `.env`
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ruta_segura

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256

# Izipay (Payments)
IZIPAY_SERVER=https://api.sandbox.izipay.pe
IZIPAY_USERNAME=your-izipay-key

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-key

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Mobile API Configuration
**File**: `apps/mobile/src/core/api/config.ts`
- Development: `http://192.168.48.174:8000` (or your PC's local IP)
- Production: `https://api.rutaseguraperu.com`

---

## 📊 Database Schema

### Key Tables
- **users** - Tourist, guide, and admin accounts
- **agencies** - Tour operator information
- **guides** - Guide profiles with verification status
- **tours** - Tour packages and details
- **tracking_points** - Real-time GPS coordinates
- **emergencies** - SOS alerts with severity levels
- **payments** - Transaction history
- **bookings** - Tour reservations
- **identity_verifications** - Document verification
- **device_tokens** - Push notification registration

**PostGIS Integration**: `tracking_points` uses `geometry(Point, 4326)` for geospatial queries

---

## 🚀 Performance Optimizations

### Mobile
- **Adaptive GPS Tracking**: Reduces battery drain in low-signal areas
- **Offline-First Sync**: Stores GPS data locally, syncs when connected
- **Metro Cache Clearing**: Regular bundle optimization
- **Hermes Engine**: JavaScript runtime for better performance

### Backend
- **Redis Caching**: Hot GPS data cached before DB persistence
- **Connection Pooling**: PostgreSQL connection optimization
- **Query Indexing**: GIS indexes on tracking points

---

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v
```

### Mobile
```bash
cd apps/mobile
npm run lint
npm run typecheck
```

---

## 📚 API Documentation

**Live Swagger UI**: http://localhost:8000/docs

### Example Endpoints
```bash
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login

# Tours
GET /api/v1/tours
GET /api/v1/tours/{tour_id}
POST /api/v1/tours/{tour_id}/book

# GPS Tracking
POST /api/v1/tracking/points
GET /api/v1/tracking/tour/{tour_id}/live

# Emergencies
POST /api/v1/emergencies/sos
GET /api/v1/emergencies/{emergency_id}
```

---

## 🐛 Troubleshooting

### "PlatformConstants could not be found"
**Solution**: Run `npx expo prebuild --clean && npx eas build --platform android --profile preview --wait`

### APK won't connect to backend
**Solution**: Verify phone is on same Wi-Fi as PC and check IP in `apps/mobile/src/core/api/config.ts`

### Metro bundler errors
**Solution**: Execute `npm run clean` and reinstall everything

### Database connection errors
**Solution**: Verify PostgreSQL running: `docker-compose up -d`

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feat: your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request with description

---

## 📄 License

Proprietary - Ruta Segura Perú

---

## 👤 Team

- **Lead**: Pedro Carranza (@Carranzae)
- **Architecture**: Cloud-Native with TurboModule Support
- **Year**: 2026

---

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/Carranzae/rutas-seguras-peru/issues
- Email: support@rutaseguraperu.com

---

## 🎯 Roadmap

### Phase 1 (Current - ✅ Complete)
- ✅ Mobile app with GPS tracking
- ✅ Emergency SOS system
- ✅ Biometric authentication
- ✅ Payment processing integration
- ✅ PlatformConstants TurboModule resolution
- ✅ Cloud-native APK deployment with EAS

### Phase 2 (In Progress)
- 🔄 Real-time MQTT streaming (low-latency GPS)
- 🔄 gRPC internal communication
- 🔄 Temporal.io workflow orchestration
- 🔄 Live Activities (iOS) + Widgets (Android)

### Phase 3
- 🔄 AI-powered guide recommendations
- 🔄 Predictive safety analytics
- 🔄 Multi-language real-time translation
- 🔄 Integration with Peruvian authorities

---

**Last Updated**: February 6, 2026  
**Status**: Production Ready with Active Development  
**Commit**: Updated with complete troubleshooting and architecture documentation
