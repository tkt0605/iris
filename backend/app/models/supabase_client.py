from supabase import create_client
import os
from dotenv import load_dotenv
load_dotenv()

# SUPABASE・環境変数の取得
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

url = SUPABASE_URL
key = SUPABASE_KEY

def get_supabase_client():
    supabase= create_client(url, key)
    return supabase