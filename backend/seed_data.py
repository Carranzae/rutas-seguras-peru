"""
Ruta Segura Perú - Seed Data Script
Populates the database with test data for development
"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import random
import sys
import os
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def seed_database():
    """Seed the database with test data."""
    print("=" * 50)
    print("🌱 Ruta Segura Perú - Seed Data")
    print("=" * 50)
    
    # Import after path setup
    from app.database import get_db, engine
    from app.models.base import Base
    from app.models.user import User, UserRole
    from app.models.agency import Agency, AgencyStatus
    from app.models.guide import Guide, GuideVerificationStatus
    from app.models.tour import Tour, TourStatus
    from app.models.payment import Payment, PaymentStatus, Booking
    from app.models.emergency import Emergency, EmergencySeverity, EmergencyStatus
    from app.core.security import get_password_hash
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
    
    async with engine.begin() as conn:
        # Create tables if not exist
        await conn.run_sync(Base.metadata.create_all)
    
    # Create async session
    from sqlalchemy.ext.asyncio import async_sessionmaker
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        try:
            # Check if already seeded
            result = await db.execute(select(User).limit(1))
            exists = result.scalar()
            
            if exists:
                print("\n⚠️ Database already has data. Skipping seed.")
                print("   Delete existing data first if you want to re-seed.")
                return
            
            print("\n📦 Creating seed data...")
            
            # ==================== USERS ====================
            print("\n👤 Creating users...")
            
            # Super Admin
            super_admin = User(
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
            db.add(super_admin)
            print(f"   ✅ Super Admin: admin@rutaseguraperu.com / Admin123!")
            
            # Agency Admin users
            agency_users = []
            agency_names = [
                ("Peru Adventures SAC", "20123456789", "Lima", "Lima"),
                ("Cusco Tours EIRL", "20987654321", "Cusco", "Cusco"),
                ("Machu Picchu Express", "20111222333", "Cusco", "Cusco"),
                ("Amazon Explorer SAC", "20444555666", "Iquitos", "Loreto"),
                ("Arequipa Travel", "20777888999", "Arequipa", "Arequipa"),
            ]
            
            for i, (name, ruc, city, region) in enumerate(agency_names):
                user = User(
                    id=uuid.uuid4(),
                    email=f"agency{i+1}@test.com",
                    phone=f"+5198000000{i+1}",
                    full_name=f"Admin {name}",
                    hashed_password=get_password_hash("Test123!"),
                    role=UserRole.AGENCY_ADMIN,
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(10, 100)),
                )
                agency_users.append(user)
                db.add(user)
            
            print(f"   ✅ Created {len(agency_users)} agency admin users")
            
            # Guide users
            guide_users = []
            guide_names = [
                "Juan Carlos Quispe",
                "María Elena Huamán",
                "Roberto Flores Mendoza",
                "Ana Lucía Paredes",
                "Carlos Alberto Mamani",
                "Rosa María Condori",
                "Pedro Pablo García",
                "Luz Marina Torres",
                "José Luis Chávez",
                "Elena Beatriz Rojas",
            ]
            
            for i, name in enumerate(guide_names):
                user = User(
                    id=uuid.uuid4(),
                    email=f"guide{i+1}@test.com",
                    phone=f"+5197000000{i+1}",
                    full_name=name,
                    hashed_password=get_password_hash("Guide123!"),
                    role=UserRole.GUIDE,
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 200)),
                )
                guide_users.append(user)
                db.add(user)
            
            print(f"   ✅ Created {len(guide_users)} guide users")
            
            # Tourist users
            tourist_users = []
            for i in range(20):
                user = User(
                    id=uuid.uuid4(),
                    email=f"tourist{i+1}@test.com",
                    phone=f"+5196000000{i+1:02d}",
                    full_name=f"Turista Prueba {i+1}",
                    hashed_password=get_password_hash("Tourist123!"),
                    role=UserRole.TOURIST,
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
                )
                tourist_users.append(user)
                db.add(user)
            
            print(f"   ✅ Created {len(tourist_users)} tourist users")
            
            await db.flush()  # Get IDs
            
            # ==================== AGENCIES ====================
            print("\n🏢 Creating agencies...")
            
            agencies = []
            statuses = [AgencyStatus.VERIFIED] * 3 + [AgencyStatus.PENDING] * 2
            
            for i, (user, (name, ruc, city, region)) in enumerate(zip(agency_users, agency_names)):
                agency = Agency(
                    id=uuid.uuid4(),
                    owner_id=user.id,
                    business_name=name,
                    ruc=ruc,
                    email=user.email,
                    phone=user.phone,
                    address=f"Av. Principal {random.randint(100, 999)}",
                    city=city,
                    region=region,
                    verification_status=statuses[i],
                    is_active=statuses[i] == AgencyStatus.VERIFIED,
                    created_at=user.created_at,
                )
                agencies.append(agency)
                db.add(agency)
            
            print(f"   ✅ Created {len(agencies)} agencies (3 verified, 2 pending)")
            
            await db.flush()
            
            # ==================== GUIDES ====================
            print("\n🧭 Creating guides...")
            
            specialties = ["Historia", "Aventura", "Naturaleza", "Fotografía", "Gastronomía"]
            languages = [["Español"], ["Español", "English"], ["Español", "English", "Français"]]
            
            guides = []
            for i, user in enumerate(guide_users):
                guide = Guide(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    agency_id=agencies[i % len(agencies)].id,
                    dircetur_id=f"DIRCETUR-{random.randint(10000, 99999)}",
                    specialty=random.choice(specialties),
                    languages=random.choice(languages),
                    experience_years=random.randint(2, 15),
                    certifications=["Primeros Auxilios", "Guía Oficial"],
                    verification_status=GuideVerificationStatus.VERIFIED if i < 7 else GuideVerificationStatus.PENDING_REVIEW,
                    is_active=True,
                    created_at=user.created_at,
                )
                guides.append(guide)
                db.add(guide)
            
            print(f"   ✅ Created {len(guides)} guides (7 verified, 3 pending)")
            
            await db.flush()
            
            # ==================== TOURS ====================
            print("\n🎒 Creating tours...")
            
            tour_templates = [
                ("Machu Picchu Full Day", "Visita guiada al santuario histórico", 450.00, 8),
                ("Valle Sagrado Express", "Recorrido por Pisac, Ollantaytambo y Chinchero", 180.00, 10),
                ("City Tour Cusco", "Descubre la ciudad imperial", 80.00, 12),
                ("Montaña de 7 Colores", "Trekking a Vinicunca", 120.00, 15),
                ("Laguna Humantay", "Trekking a la laguna turquesa", 100.00, 15),
                ("Moray y Salineras", "Sitios arqueológicos únicos", 90.00, 12),
                ("Tour Amazon Jungle", "3 días en la selva amazónica", 350.00, 8),
                ("Cañón del Colca", "2 días viendo cóndores", 220.00, 10),
                ("Líneas de Nazca", "Vuelo sobre las líneas misteriosas", 150.00, 6),
                ("Islas Ballestas", "Mini Galápagos de Perú", 80.00, 20),
                ("Tour Gastronómico Lima", "Sabores del Perú", 120.00, 10),
                ("Trekking Salkantay", "5 días de aventura", 550.00, 12),
                ("Rafting Urubamba", "Aventura en río", 90.00, 8),
                ("Tour Nocturno Cusco", "La magia de la noche", 45.00, 15),
                ("Zipline Valle Sagrado", "Adrenalina pura", 75.00, 12),
            ]
            
            tours = []
            statuses_tour = [TourStatus.SCHEDULED, TourStatus.IN_PROGRESS, TourStatus.COMPLETED]
            
            for i, (name, desc, price, capacity) in enumerate(tour_templates):
                agency = agencies[i % len(agencies)]
                guide = guides[i % len(guides)]
                
                scheduled_start = datetime.now(timezone.utc) + timedelta(days=random.randint(-5, 30))
                status = random.choice(statuses_tour)
                
                tour = Tour(
                    id=uuid.uuid4(),
                    agency_id=agency.id,
                    guide_id=guide.id,
                    name=name,
                    description=desc,
                    price=Decimal(str(price)),
                    duration_hours=random.randint(4, 12),
                    max_participants=capacity,
                    current_bookings=random.randint(0, capacity - 2),
                    category=random.choice(["adventure", "cultural", "nature", "gastronomy"]),
                    difficulty=random.choice(["easy", "moderate", "hard"]),
                    status=status,
                    scheduled_start=scheduled_start,
                    is_active=True,
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(5, 60)),
                )
                tours.append(tour)
                db.add(tour)
            
            print(f"   ✅ Created {len(tours)} tours")
            
            await db.flush()
            
            # ==================== BOOKINGS ====================
            print("\n📋 Creating bookings...")
            
            bookings = []
            booking_statuses = ["confirmed", "pending", "cancelled", "completed"]
            
            for i in range(30):
                tour = random.choice(tours)
                tourist = random.choice(tourist_users)
                participants = random.randint(1, 4)
                
                booking = Booking(
                    id=uuid.uuid4(),
                    tour_id=tour.id,
                    user_id=tourist.id,
                    participants=participants,
                    total_amount=float(tour.price) * participants,
                    status=random.choice(booking_statuses),
                    booking_date=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
                    special_requests="Sin requerimientos especiales",
                    created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
                )
                bookings.append(booking)
                db.add(booking)
            
            print(f"   ✅ Created {len(bookings)} bookings")
            
            await db.flush()
            
            # ==================== PAYMENTS ====================
            print("\n💳 Creating payments...")
            
            payment_methods = ["card", "yape", "plin", "bank_transfer"]
            
            for i, booking in enumerate(bookings[:20]):  # 20 payments
                amount = Decimal(str(booking.total_amount))
                platform_fee = amount * Decimal("0.15")
                agency_amount = amount * Decimal("0.70")
                guide_amount = amount * Decimal("0.15")
                
                payment = Payment(
                    id=uuid.uuid4(),
                    booking_id=booking.id,
                    amount=amount,
                    platform_fee=platform_fee,
                    agency_amount=agency_amount,
                    guide_amount=guide_amount,
                    currency="PEN",
                    status=PaymentStatus.COMPLETED if i < 15 else PaymentStatus.PENDING,
                    payment_method=random.choice(payment_methods),
                    transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                    created_at=booking.created_at + timedelta(hours=random.randint(1, 24)),
                )
                db.add(payment)
            
            print(f"   ✅ Created 20 payments (15 completed, 5 pending)")
            
            # ==================== EMERGENCIES ====================
            print("\n🆘 Creating emergencies...")
            
            severities = [EmergencySeverity.CRITICAL, EmergencySeverity.HIGH, EmergencySeverity.MEDIUM]
            
            for i in range(3):
                tourist = random.choice(tourist_users)
                tour = random.choice(tours)
                
                emergency = Emergency(
                    id=uuid.uuid4(),
                    triggered_by_id=tourist.id,
                    tour_id=tour.id,
                    severity=severities[i],
                    status=EmergencyStatus.ACTIVE if i == 0 else EmergencyStatus.RESPONDING,
                    description=f"Emergencia de prueba #{i+1}",
                    battery_level=random.randint(5, 30),
                    latitude=-13.5 + random.random(),
                    longitude=-71.9 + random.random(),
                    created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)),
                )
                db.add(emergency)
            
            print(f"   ✅ Created 3 active emergencies")
            
            # Commit all
            await db.commit()
            
            print("\n" + "=" * 50)
            print("✅ Seed data created successfully!")
            print("=" * 50)
            print("\n📋 Test Credentials:")
            print("   Super Admin: admin@rutaseguraperu.com / Admin123!")
            print("   Agency Admin: agency1@test.com / Test123!")
            print("   Guide: guide1@test.com / Guide123!")
            print("   Tourist: tourist1@test.com / Tourist123!")
            
        except Exception as e:
            await db.rollback()
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(seed_database())
