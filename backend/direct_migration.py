# direct_migration.py
import asyncio
import asyncpg

async def run():
    print("Connecting to ruta_segura_peru...")
    conn = await asyncpg.connect('postgresql://postgres:123@localhost:5432/ruta_segura_peru')
    print("Connected. Running ALTER TABLE...")
    
    queries = [
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS nationality VARCHAR;",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS residence_city VARCHAR;",
        "ALTER TABLE guides ADD COLUMN IF NOT EXISTS department VARCHAR;"
    ]
    
    for q in queries:
        try:
            await conn.execute(q)
            print(f"Executed: {q}")
        except Exception as e:
            print(f"Error on {q}: {e}")
            
    await conn.close()
    print("Done!")

if __name__ == '__main__':
    asyncio.run(run())
