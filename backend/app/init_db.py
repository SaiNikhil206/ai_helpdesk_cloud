from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from app.config import Config
load_dotenv()

database_url = Config.CONNECTION_PG_DB

engine = create_engine(database_url,
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10,
        },
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,  
        pool_recycle=300,)

sessionLocal = sessionmaker(autoflush=False,expire_on_commit=False,bind=engine)

def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()


Base = declarative_base()

