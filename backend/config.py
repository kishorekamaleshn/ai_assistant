import os
from dotenv import load_dotenv

# Load environment variables early, once and for all
load_dotenv(dotenv_path="../.env")

class Settings:
    # Security Configurations
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "fallback_secret_for_local_dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # External APIs
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")

# Global settings instance to be imported across the app
settings = Settings()
