import os
from sqlmodel import create_engine, Session, SQLModel
from dotenv import load_dotenv

load_dotenv()

# Get Database URL from environment or default to local sqlite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./eduverse.db")

# Ensure PostgreSQL connections on Render use the correct driver and SSL if needed
if "postgresql" in DATABASE_URL:
    # Add sslmode=require if it's not already in the URL (common for Render external URLs)
    if "sslmode=" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL += f"{separator}sslmode=require"

engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
