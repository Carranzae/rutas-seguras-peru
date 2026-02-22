# run_migration_proper.py
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

import asyncio
from sqlalchemy import text
from app.db.session import engine

async def run_migration():
    print("Running manual migration...")
    async with engine.begin() as conn:
        print("Executing ALTER TABLE statements...")
        try:
            await conn.execute(text("ALTER TABLE guides ADD COLUMN IF NOT EXISTS nationality VARCHAR;"))
            await conn.execute(text("ALTER TABLE guides ADD COLUMN IF NOT EXISTS residence_city VARCHAR;"))
            await conn.execute(text("ALTER TABLE guides ADD COLUMN IF NOT EXISTS department VARCHAR;"))
            print("Successfully added nationality, residence_city, and department columns to the guides table.")
        except Exception as e:
            print(f"Error executing migration: {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
