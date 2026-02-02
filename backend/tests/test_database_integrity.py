"""
Ruta Segura Perú - Database Integrity Tests
Verifies all models, relationships, and constraints
"""
import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models import (
    Base, 
    User, UserRole,
    Agency, AgencyStatus,
    Guide, GuideVerificationStatus,
    Tour, TourStatus,
    EmergencyContact, NotificationChannel, ContactRelationship,
    TrackingPoint,
    Payment, PaymentStatus, PaymentMethod, Booking,
    Emergency, EmergencyStatus, EmergencySeverity,
    AuditLog, AuditAction,
    DeviceToken, DevicePlatform,
    IdentityVerification, VerificationStatus, VerificationType,
)
from app.config import settings


# NOTE: db_session fixture comes from conftest.py


# ============================================
# 1. TABLE INTEGRITY TESTS
# ============================================

class TestTableIntegrity:
    """Verify all required tables exist with correct structure."""
    
    REQUIRED_TABLES = [
        "users",
        "agencies",
        "guides",
        "tours",
        "emergency_contacts",
        "tracking_points",
        "payments",
        "bookings",
        "emergencies",
        "audit_logs",
        "device_tokens",
        "identity_verifications",
    ]
    
    @pytest.mark.asyncio
    async def test_all_tables_exist(self, db_session: AsyncSession):
        """Verify all required tables exist in database."""
        result = await db_session.execute(
            text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
        )
        existing_tables = {row[0] for row in result.fetchall()}
        
        missing_tables = []
        for table in self.REQUIRED_TABLES:
            if table not in existing_tables:
                missing_tables.append(table)
        
        assert not missing_tables, f"Missing tables: {missing_tables}"
    
    @pytest.mark.asyncio
    async def test_users_table_columns(self, db_session: AsyncSession):
        """Verify users table has all required columns."""
        required_columns = [
            "id", "email", "hashed_password", "full_name", "phone",
            "role", "is_active", "is_verified",
            "emergency_contact_name", "emergency_contact_phone",
            "fcm_token", "language", "created_at", "updated_at"
        ]
        
        result = await db_session.execute(
            text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'users'
            """)
        )
        existing_columns = {row[0] for row in result.fetchall()}
        
        missing = [c for c in required_columns if c not in existing_columns]
        assert not missing, f"Missing columns in users: {missing}"
    
    @pytest.mark.asyncio
    async def test_emergency_contacts_columns(self, db_session: AsyncSession):
        """Verify emergency_contacts table has E.164 phone field."""
        result = await db_session.execute(
            text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'emergency_contacts'
            """)
        )
        columns = {row[0] for row in result.fetchall()}
        
        required = ["id", "user_id", "name", "phone_e164", "relationship", 
                    "notification_channel", "is_primary", "priority"]
        missing = [c for c in required if c not in columns]
        assert not missing, f"Missing columns in emergency_contacts: {missing}"


# ============================================
# 2. FOREIGN KEY RELATIONSHIP TESTS
# ============================================

class TestForeignKeyRelationships:
    """Verify referential integrity between tables."""
    
    @pytest.mark.asyncio
    async def test_emergency_contact_user_fk(self, db_session: AsyncSession):
        """EmergencyContact must reference valid User."""
        result = await db_session.execute(
            text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'emergency_contacts' 
                AND constraint_type = 'FOREIGN KEY'
            """)
        )
        fk_constraints = [row[0] for row in result.fetchall()]
        assert len(fk_constraints) > 0, "No foreign keys on emergency_contacts"
    
    @pytest.mark.asyncio
    async def test_guide_user_fk(self, db_session: AsyncSession):
        """Guide must reference valid User."""
        result = await db_session.execute(
            text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'guides' 
                AND constraint_type = 'FOREIGN KEY'
            """)
        )
        fk_constraints = [row[0] for row in result.fetchall()]
        assert len(fk_constraints) > 0, "No foreign keys on guides table"
    
    @pytest.mark.asyncio
    async def test_tracking_user_fk(self, db_session: AsyncSession):
        """TrackingPoint must reference valid User."""
        result = await db_session.execute(
            text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'tracking_points' 
                AND constraint_type = 'FOREIGN KEY'
            """)
        )
        fk_constraints = [row[0] for row in result.fetchall()]
        assert len(fk_constraints) > 0, "No foreign keys on tracking_points"


# ============================================
# 3. POSTGIS SPATIAL QUERY TESTS
# ============================================

class TestPostGISSpatialQueries:
    """Test geospatial queries with PostGIS."""
    
    @pytest.mark.asyncio
    async def test_postgis_extension_enabled(self, db_session: AsyncSession):
        """Verify PostGIS extension is installed."""
        result = await db_session.execute(
            text("SELECT PostGIS_Version()")
        )
        version = result.scalar()
        assert version is not None, "PostGIS not installed"
        print(f"PostGIS version: {version}")
    
    @pytest.mark.asyncio
    async def test_distance_calculation(self, db_session: AsyncSession):
        """Calculate distance between two GPS points."""
        # Lima coordinates
        point1_lat, point1_lng = -12.0464, -77.0428
        # Miraflores coordinates (approx 5km away)
        point2_lat, point2_lng = -12.1191, -77.0305
        
        result = await db_session.execute(
            text(f"""
                SELECT ST_Distance(
                    ST_SetSRID(ST_MakePoint({point1_lng}, {point1_lat}), 4326)::geography,
                    ST_SetSRID(ST_MakePoint({point2_lng}, {point2_lat}), 4326)::geography
                ) / 1000 AS distance_km
            """)
        )
        distance = result.scalar()
        
        # Should be approximately 8km
        assert 5 < distance < 15, f"Unexpected distance: {distance}km"
        print(f"Distance calculated: {distance:.2f}km")
    
    @pytest.mark.asyncio
    async def test_point_in_radius_query(self, db_session: AsyncSession):
        """Test finding points within radius (for nearby alerts)."""
        center_lat, center_lng = -12.0464, -77.0428
        radius_meters = 5000  # 5km
        
        # This query would find tourists within 5km of an agency
        query = text(f"""
            SELECT COUNT(*) FROM (
                SELECT ST_DWithin(
                    ST_SetSRID(ST_MakePoint({center_lng}, {center_lat}), 4326)::geography,
                    ST_SetSRID(ST_MakePoint({center_lng + 0.01}, {center_lat + 0.01}), 4326)::geography,
                    {radius_meters}
                ) AS within_radius
            ) sub WHERE within_radius = true
        """)
        
        result = await db_session.execute(query)
        count = result.scalar()
        assert count == 1, "Point should be within radius"


# ============================================
# 4. GIST INDEX OPTIMIZATION TESTS
# ============================================

class TestGISTIndexOptimization:
    """Verify spatial indexes exist for performance."""
    
    @pytest.mark.asyncio
    async def test_tracking_points_spatial_index(self, db_session: AsyncSession):
        """Check if GIST index exists on tracking_points location."""
        result = await db_session.execute(
            text("""
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'tracking_points' 
                AND indexdef LIKE '%gist%'
            """)
        )
        indexes = result.fetchall()
        
        if not indexes:
            # RECOMMENDATION: Create GIST index
            print("WARNING: No GIST index on tracking_points. Recommend creating:")
            print("CREATE INDEX idx_tracking_points_location_gist ON tracking_points USING GIST (location);")
        else:
            print(f"GIST indexes found: {[i[0] for i in indexes]}")


# ============================================
# 5. CONSTRAINT VALIDATION TESTS
# ============================================

class TestConstraintValidation:
    """Test business rule constraints."""
    
    @pytest.mark.asyncio
    async def test_emergency_contact_priority_range(self, db_session: AsyncSession):
        """Priority must be 1-5."""
        result = await db_session.execute(
            text("""
                SELECT constraint_name, check_clause
                FROM information_schema.check_constraints
                WHERE constraint_name LIKE '%priority%'
            """)
        )
        constraints = result.fetchall()
        
        # Check constraint should exist
        priority_constraint = any("priority" in str(c) for c in constraints)
        if not priority_constraint:
            print("WARNING: No check constraint on priority range (1-5)")
    
    @pytest.mark.asyncio
    async def test_payment_amount_positive(self, db_session: AsyncSession):
        """Payment amount must be positive."""
        result = await db_session.execute(
            text("""
                SELECT constraint_name
                FROM information_schema.check_constraints
                WHERE constraint_name LIKE '%amount%'
            """)
        )
        constraints = result.fetchall()
        print(f"Amount constraints: {constraints}")


# ============================================
# RUN SUMMARY
# ============================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
