# PostgreSQL + PostGIS Setup Guide - Ruta Segura Perú

## Overview

The backend requires PostgreSQL with the PostGIS extension for geospatial operations.

---

## Option 1: Docker (Recommended for Development)

```bash
# Start PostgreSQL with PostGIS
docker run -d \
  --name ruta-segura-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ruta_segura_peru \
  -p 5432:5432 \
  postgis/postgis:15-3.4

# Verify it's running
docker ps
```

---

## Option 2: Local Installation (Windows)

### Step 1: Install PostgreSQL

1. Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember your password for `postgres` user
4. Port: `5432` (default)

### Step 2: Install PostGIS

1. Open **Stack Builder** (installed with PostgreSQL)
2. Select your PostgreSQL installation
3. Under **Spatial Extensions**, select **PostGIS**
4. Complete the installation

### Step 3: Create Database

Open **pgAdmin** or **psql**:

```sql
-- Create database
CREATE DATABASE ruta_segura_peru;

-- Connect to database
\c ruta_segura_peru

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS
SELECT PostGIS_Version();
```

---

## Option 3: Local Installation (macOS)

```bash
# Install with Homebrew
brew install postgresql@15
brew install postgis

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb ruta_segura_peru

# Enable PostGIS
psql ruta_segura_peru -c "CREATE EXTENSION postgis;"
```

---

## Configure Connection String

Update your `backend/.env`:

```env
# Local connection
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ruta_segura_peru

# Or with custom credentials
DATABASE_URL=postgresql+asyncpg://myuser:mypassword@localhost:5432/ruta_segura_peru
```

---

## Run Migrations

After database is ready:

```bash
cd backend

# Activate virtual environment
source venv/Scripts/activate  # Windows
source venv/bin/activate      # macOS/Linux

# Generate initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

---

## Verify Setup

```bash
# Start the backend
python -m uvicorn app.main:app --reload

# Check health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","app":"RutaSeguraPeru","version":"1.0.0","environment":"development"}
```

---

## Useful Commands

```sql
-- List all tables
\dt

-- View table structure
\d users
\d emergencies

-- Check PostGIS functions
SELECT * FROM pg_extension WHERE extname = 'postgis';

-- Query geographic data
SELECT id, ST_AsText(location) FROM emergencies;
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check PostgreSQL service is running |
| PostGIS not found | Install PostGIS extension |
| Permission denied | Check username/password in .env |
| asyncpg not installed | Run `pip install asyncpg` |

---

## Production Recommendations

1. Use managed PostgreSQL (AWS RDS, Cloud SQL, etc.)
2. Enable SSL connections
3. Set up connection pooling (PgBouncer)
4. Regular backups
5. Monitor disk space for PostGIS data
