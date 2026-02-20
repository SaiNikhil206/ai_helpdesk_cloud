from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from config import Config
load_dotenv()

database_url = Config.CONNECTION_PG_DB

engine = create_engine(database_url)

sessionLocal = sessionmaker(autoflush=False,expire_on_commit=False,bind=engine)

def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()


Base = declarative_base()

