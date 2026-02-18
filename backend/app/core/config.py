from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os
load_dotenv()

# 環境変数の取得
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
PROJECT_NAME = os.getenv('PROJECT_NAME')
class settings(BaseSettings):
    OPENAI_API_KEY: str = OPENAI_API_KEY
    SUPABASE_URL: str = SUPABASE_URL
    SUPABASE_KEY: str = SUPABASE_KEY

    PROJECT_NAME: str = PROJECT_NAME
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")