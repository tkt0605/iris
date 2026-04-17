from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_JWT_SECRET: str
    GEMINI_API_KEY: str
    PRODUCER: str = "IRIS開発者"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()