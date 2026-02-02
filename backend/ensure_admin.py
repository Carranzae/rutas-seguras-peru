"""
Script to ensure Super Admin user exists
Run if you get 401 Unauthorized errors
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def ensure_admin():
    """Create or update super admin user."""
    from app.database import engine
    from app.models.base import Base
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    from sqlalchemy import select

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Check if admin exists
        result = await db.execute(
            select(User).where(User.email == "admin@rutaseguraperu.com")
        )
        admin = result.scalar_one_or_none()

        if admin:
            # Update role if not super_admin
            if admin.role != UserRole.SUPER_ADMIN:
                admin.role = UserRole.SUPER_ADMIN
                admin.is_active = True
                admin.is_verified = True
                print(f"✅ Updated existing user to super_admin role")
            else:
                print(f"✅ Admin user already exists with correct role")
            
            # Reset password
            admin.hashed_password = get_password_hash("Admin123!")
            print(f"   Password reset to: Admin123!")
        else:
            # Create new admin
            import uuid
            from datetime import datetime, timezone
            
            admin = User(
                id=uuid.uuid4(),
                email="admin@rutaseguraperu.com",
                phone="+51999999999",
                full_name="Administrador Sistema",
                hashed_password=get_password_hash("Admin123!"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(admin)
            print(f"✅ Created new super_admin user")

        await db.commit()
        
        print("\n📋 Credentials:")
        print("   Email: admin@rutaseguraperu.com")
        print("   Password: Admin123!")


if __name__ == "__main__":
    asyncio.run(ensure_admin())
