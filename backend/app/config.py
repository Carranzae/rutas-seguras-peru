"""
Ruta Segura Perú - Backend Configuration
Pydantic Settings for environment variable management
"""
from functools import lru_cache
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "RutaSeguraPeru"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    
    # Server (PORT is provided by Railway automatically)
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ruta_segura_peru"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    
    # JWT Security
    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Password Hashing
    password_hash_rounds: int = 12
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    login_rate_limit_per_minute: int = 5
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Firebase - supports both file path and JSON string (for Railway/cloud)
    firebase_credentials_path: str = "./firebase-credentials.json"
    firebase_credentials_json: str = ""  # JSON string for cloud deployments
    
    # Vonage (SMS, WhatsApp, Voice)
    vonage_api_key: str = ""
    vonage_api_secret: str = ""
    vonage_from_number: str = "RutaSegura"
    vonage_whatsapp_number: str = "14157386102"
    vonage_application_id: str = ""
    vonage_private_key_path: str = "./vonage-private.key"
    
    # IziPay (Payment Gateway)
    izipay_merchant_code: str = ""
    izipay_public_key: str = ""
    izipay_private_key: str = ""
    izipay_endpoint: str = "https://api.micuentaweb.pe"
    izipay_webhook_secret: str = ""
    
    # Translation
    translation_api_url: str = ""
    translation_api_key: str = ""
    
    # AI Safety (Claude)
    anthropic_api_key: str = ""  # For Claude AI safety analysis
    
    # Emergency
    emergency_escalation_minutes: int = 5
    emergency_sms_enabled: bool = True
    emergency_call_enabled: bool = True
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8081"]
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v
    
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"
    
    @property
    def is_development(self) -> bool:
        return self.app_env == "development"
    
    @property
    def api_base_url(self) -> str:
        """Get base URL for webhooks (use ngrok in dev for Plivo)."""
        if self.is_production:
            return "https://api.rutaseguraperu.com"
        return f"http://{self.host}:{self.port}"

@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
