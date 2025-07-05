from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
import logging
import time
from sqlalchemy.exc import OperationalError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.AUTH_POSTGRES_USER}:{settings.AUTH_POSTGRES_PASSWORD}@{settings.AUTH_POSTGRES_HOST}:{settings.AUTH_POSTGRES_PORT}/{settings.AUTH_POSTGRES_DB}"

def wait_for_db(max_retries=30, retry_interval=2):
    """Attendre que la base de données soit disponible"""
    for attempt in range(max_retries):
        try:
            engine = create_engine(SQLALCHEMY_DATABASE_URL)
            connection = engine.connect()
            connection.close()
            logger.info("✅ Base de données connectée avec succès!")
            return engine
        except OperationalError as e:
            logger.info(f"⏳ Tentative {attempt + 1}/{max_retries} - DB non disponible: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_interval)
            else:
                logger.error("❌ Impossible de se connecter à la base de données après toutes les tentatives")
                raise
    
engine = wait_for_db()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
