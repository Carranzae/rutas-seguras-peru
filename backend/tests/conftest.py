"""
Ruta Segura Perú - Pytest Configuration
Fixed async fixtures using pytest_asyncio
"""
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.config import settings


# Configure pytest-asyncio
pytest_plugins = ['pytest_asyncio']


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Create async HTTP client for API testing.
    Uses ASGITransport for proper async handling.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create async database session for testing.
    Yields the actual session object, not the generator.
    """
    engine = create_async_engine(
        settings.database_url,
        echo=False,
    )
    async_session_maker = sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session
    
    await engine.dispose()


@pytest.fixture
def valid_credentials():
    """Valid test user credentials."""
    return {
        "email": "test@rutasegura.pe",
        "password": "TestPassword123!",
    }


@pytest.fixture
def invalid_credentials():
    """Invalid credentials for brute force testing."""
    return {
        "email": "test@rutasegura.pe",
        "password": "WrongPassword",
    }
