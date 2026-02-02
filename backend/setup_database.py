"""
Ruta Segura Peru - Database Setup Script
Creates the database and all tables
"""
import asyncio
import asyncpg
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


async def create_database():
    """Create the database if it doesn't exist."""
    print("[*] Connecting to PostgreSQL...")
    
    try:
        # Connect to default postgres database
        conn = await asyncpg.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='123',
            database='postgres'
        )
        
        # Check if database exists
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'ruta_segura_peru'"
        )
        
        if not exists:
            print("[*] Creating database 'ruta_segura_peru'...")
            await conn.execute('CREATE DATABASE ruta_segura_peru')
            print("[OK] Database created successfully!")
        else:
            print("[OK] Database 'ruta_segura_peru' already exists!")
        
        await conn.close()
        
        # Connect to new database and enable PostGIS
        print("[*] Enabling PostGIS extension...")
        conn = await asyncpg.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='123',
            database='ruta_segura_peru'
        )
        
        try:
            await conn.execute('CREATE EXTENSION IF NOT EXISTS postgis')
            print("[OK] PostGIS extension enabled!")
        except Exception as e:
            print(f"[!] PostGIS not available: {e}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] {e}")
        return False


async def create_tables():
    """Create all tables using SQLAlchemy models."""
    print("\n[*] Creating tables...")
    
    # Import after creating database
    from app.database import engine
    from app.models.base import Base
    from app.models import user, agency, guide, tour, payment, emergency, tracking
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("[OK] All tables created successfully!")
    
    # List tables
    connection = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='123',
        database='ruta_segura_peru'
    )
    
    tables = await connection.fetch("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    """)
    
    print("\n[*] Tables in database:")
    for table in tables:
        print(f"   - {table['tablename']}")
    
    await connection.close()


async def main():
    print("=" * 50)
    print("Ruta Segura Peru - Database Setup")
    print("=" * 50)
    
    # Create database
    success = await create_database()
    if not success:
        print("\n[ERROR] Failed to create database. Make sure PostgreSQL is running.")
        sys.exit(1)
    
    # Create tables
    await create_tables()
    
    print("\n" + "=" * 50)
    print("[OK] Database setup complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
