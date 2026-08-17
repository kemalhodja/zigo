from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Text, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
import os
import uuid
import datetime
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meta_media_id = Column(String, unique=True, index=True, nullable=True) # For deduplication
    caption = Column(Text, nullable=True)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True) # IMAGE, VIDEO, CAROUSEL_ALBUM
    author_id = Column(UUID(as_uuid=True), nullable=True) # Assigned to the mapped user/admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

async def create_post_from_meta(media_data: dict, author_id: str = None) -> Post:
    """
    Creates a new post in the database from Meta webhook data.
    Checks for duplicates using meta_media_id.
    """
    meta_media_id = media_data.get("id")
    
    async with AsyncSessionLocal() as session:
        # Check for deduplication
        query = text("SELECT id FROM posts WHERE meta_media_id = :media_id")
        result = await session.execute(query, {"media_id": meta_media_id})
        existing_post = result.fetchone()
        
        if existing_post:
            logger.info(f"Post with Meta ID {meta_media_id} already exists. Skipping.")
            return None
            
        # Create new post
        new_post = Post(
            meta_media_id=meta_media_id,
            caption=media_data.get("caption", ""),
            media_url=media_data.get("permanent_media_url", media_data.get("media_url")),
            media_type=media_data.get("media_type", "UNKNOWN"),
            author_id=author_id # You can map this based on Meta user ID in a real app
        )
        
        session.add(new_post)
        try:
            await session.commit()
            await session.refresh(new_post)
            logger.info(f"Successfully created post from Meta media {meta_media_id}")
            return new_post
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to insert post for Meta media {meta_media_id}: {e}")
            raise
