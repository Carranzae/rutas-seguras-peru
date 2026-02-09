"""
Ruta Segura Perú - Database Seeder
Creates initial Super Admin user with bcrypt-hashed password

Usage:
    python -m app.scripts.seed_admin

Environment:
    Set DATABASE_URL to your PostgreSQL connection string
    Or run from Railway console where DATABASE_URL is configured
"""
import asyncio
import os
import sys
from datetime import datetime
from uuid import uuid4

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    import bcrypt
except ImportError:
    print("Error: bcrypt not installed. Run: pip install bcrypt")
    sys.exit(1)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


# Configuration
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "pedro@rutasegura.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "RutaSegura2024!")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Pedro Admin")


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt with 12 rounds.
    Secure for production - takes ~250ms to compute.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


async def seed_super_admin():
    """
    Insert Super Admin user into database.
    Skips if user already exists.
    """
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ Error: DATABASE_URL not set")
        print("   Set it in your environment or Railway variables")
        return False
    
    # Convert postgres:// to postgresql+asyncpg://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    print(f"📡 Connecting to database...")
    
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check if user exists
            result = await session.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": ADMIN_EMAIL}
            )
            existing = result.fetchone()
            
            if existing:
                print(f"⚠️  Usuario ya existe: {ADMIN_EMAIL}")
                print(f"   ID: {existing[0]}")
                return True
            
            # Create new admin
            user_id = str(uuid4())
            hashed_password = hash_password(ADMIN_PASSWORD)
            
            print(f"🔐 Creando Super Admin...")
            print(f"   Email: {ADMIN_EMAIL}")
            print(f"   Password: {'*' * len(ADMIN_PASSWORD)}")
            print(f"   Bcrypt rounds: 12")
            
            await session.execute(
                text("""
                    INSERT INTO users (
                        id, email, hashed_password, full_name, 
                        role, is_active, is_verified, created_at, updated_at
                    ) VALUES (
                        :id, :email, :password, :name,
                        'super_admin', true, true, :now, :now
                    )
                """),
                {
                    "id": user_id,
                    "email": ADMIN_EMAIL,
                    "password": hashed_password,
                    "name": ADMIN_NAME,
                    "now": datetime.utcnow(),
                }
            )
            
            await session.commit()
            
            print(f"✅ Super Admin creado exitosamente!")
            print(f"   ID: {user_id}")
            print(f"\n🔑 Credenciales de acceso:")
            print(f"   Email: {ADMIN_EMAIL}")
            print(f"   Password: {ADMIN_PASSWORD}")
            print(f"\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login!")
            
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await session.rollback()
            return False
        finally:
            await engine.dispose()


async def verify_admin_login():
    """Verify the created admin can log in"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        return
    
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(
            text("SELECT hashed_password FROM users WHERE email = :email"),
            {"email": ADMIN_EMAIL}
        )
        row = result.fetchone()
        
        if row:
            if verify_password(ADMIN_PASSWORD, row[0]):
                print(f"✅ Verificación de login: OK")
            else:
                print(f"❌ Verificación de login: FALLÓ")
        
        await engine.dispose()


def main():
    """Main entry point"""
    print("=" * 50)
    print("🛡️  RUTA SEGURA - SUPER ADMIN SEEDER")
    print("=" * 50)
    print()
    
    # Allow override via command line
    global ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
    
    if len(sys.argv) > 1:
        ADMIN_EMAIL = sys.argv[1]
    if len(sys.argv) > 2:
        ADMIN_PASSWORD = sys.argv[2]
    if len(sys.argv) > 3:
        ADMIN_NAME = sys.argv[3]
    
    success = asyncio.run(seed_super_admin())
    
    if success:
        asyncio.run(verify_admin_login())
        print()
        print("=" * 50)
        print("🚀 LISTO PARA PRODUCCIÓN")
        print("=" * 50)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
