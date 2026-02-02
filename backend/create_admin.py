"""
Ruta Segura Perú - Create Users
Simple script to create test users
"""
import asyncio
import asyncpg
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main():
    print("🔄 Connecting to database...")
    
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='123',
        database='ruta_segura_peru'
    )
    
    now = datetime.now(timezone.utc)
    
    # Create Super Admin
    existing = await conn.fetchval("SELECT 1 FROM users WHERE email = 'admin@rutaseguraperu.com'")
    if not existing:
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_verified, language, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, uuid.uuid4(), 'admin@rutaseguraperu.com', pwd_context.hash("Admin123!"), 
            'Super Administrator', 'SUPER_ADMIN', True, True, 'es', now, now)
        print("✅ Super Admin: admin@rutaseguraperu.com / Admin123!")
    else:
        print("ℹ️ Super Admin already exists")
    
    # Create Tourist
    existing = await conn.fetchval("SELECT 1 FROM users WHERE email = 'turista@test.com'")
    if not existing:
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, is_verified, language, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, uuid.uuid4(), 'turista@test.com', pwd_context.hash("Test123!"), 
            'Juan Pérez', '+51999888777', 'TOURIST', True, True, 'es', now, now)
        print("✅ Tourist: turista@test.com / Test123!")
    else:
        print("ℹ️ Tourist already exists")
    
    # Create Agency Admin
    existing = await conn.fetchval("SELECT 1 FROM users WHERE email = 'agencia@test.com'")
    if not existing:
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_verified, language, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """, uuid.uuid4(), 'agencia@test.com', pwd_context.hash("Agency123!"), 
            'María García', 'AGENCY_ADMIN', True, True, 'es', now, now)
        print("✅ Agency Admin: agencia@test.com / Agency123!")
    else:
        print("ℹ️ Agency Admin already exists")
    
    # Create Guide
    existing = await conn.fetchval("SELECT 1 FROM users WHERE email = 'guia@test.com'")
    if not existing:
        await conn.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, phone, role, is_active, is_verified, language, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, uuid.uuid4(), 'guia@test.com', pwd_context.hash("Guide123!"), 
            'Carlos Rodriguez', '+51922333444', 'GUIDE', True, True, 'es', now, now)
        print("✅ Guide: guia@test.com / Guide123!")
    else:
        print("ℹ️ Guide already exists")
    
    await conn.close()
    
    print("\n✅ Users created!")
    print("\n📋 Credentials:")
    print("   admin@rutaseguraperu.com / Admin123!")
    print("   turista@test.com / Test123!")
    print("   agencia@test.com / Agency123!")
    print("   guia@test.com / Guide123!")


if __name__ == "__main__":
    asyncio.run(main())
