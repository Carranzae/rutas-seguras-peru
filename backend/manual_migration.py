import asyncio
from sqlalchemy import text
from app.db.session import engine

async def run_migration():
    print("Running manual migration...")
    async with engine.begin() as conn:
        print("Checking if columns exist...")
        
        try:
            await conn.execute(text("ALTER TABLE guides ADD COLUMN nationality VARCHAR"))
            print("Added nationality.")
        except Exception as e:
            print(f"Column nationality might already exist: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE guides ADD COLUMN residence_city VARCHAR"))
            print("Added residence_city.")
        except Exception as e:
            print(f"Column residence_city might already exist: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE guides ADD COLUMN department VARCHAR"))
            print("Added department.")
        except Exception as e:
            print(f"Column department might already exist: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
