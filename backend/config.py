from dotenv import load_dotenv
import os
load_dotenv()

class Config:
    # Database configuration
    DB_USERNAME = os.getenv("DB_USERNAME")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_BASE = os.getenv("DB_BASE")
    VECTOR_BASE = os.getenv("VECTOR_BASE")
    # OpenAI API configuration
    OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
    GROQ_API_KEY=os.getenv("GROQ_API_KEY")
    HF_TOKEN=os.getenv("HF_TOKEN")
    # Vector database configuration
    CONNECTION_PG_DB = os.getenv("CONNECTION_PG_DB")
    CONNECTION_PG_VECTORDB = os.getenv("CONNECTION_PG_VECTORDB")
    CONNECTION_NAME = os.getenv("CONNECTION_NAME")