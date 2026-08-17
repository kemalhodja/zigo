import aiobotocore.session
import httpx
import os
import uuid
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION_NAME = os.getenv("AWS_REGION_NAME", "eu-central-1")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL")  # Useful for Cloudflare R2 / Render

async def upload_external_media_to_storage(media_url: str) -> str:
    """
    Downloads media from an external URL (e.g. Meta CDN) and uploads it to S3/R2 storage.
    Returns the permanent URL of the uploaded media.
    """
    if not media_url:
        return ""
        
    try:
        # Determine file extension
        parsed_url = urlparse(media_url)
        path = parsed_url.path
        ext = os.path.splitext(path)[1]
        if not ext:
            ext = ".jpg"  # fallback
            
        file_name = f"meta_imports/{uuid.uuid4()}{ext}"
        
        # Download file
        async with httpx.AsyncClient() as client:
            response = await client.get(media_url)
            response.raise_for_status()
            file_content = response.content
            content_type = response.headers.get("Content-Type", "application/octet-stream")

        # Upload to S3/R2
        session = aiobotocore.session.get_session()
        async with session.create_client(
            's3', 
            region_name=AWS_REGION_NAME,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            endpoint_url=AWS_ENDPOINT_URL
        ) as client:
            await client.put_object(
                Bucket=AWS_BUCKET_NAME,
                Key=file_name,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'
            )
            
            # Construct permanent URL
            if AWS_ENDPOINT_URL:
                # Custom endpoint like Cloudflare R2
                permanent_url = f"{AWS_ENDPOINT_URL}/{AWS_BUCKET_NAME}/{file_name}"
            else:
                # Standard AWS S3
                permanent_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com/{file_name}"
                
            return permanent_url
            
    except Exception as e:
        logger.error(f"Failed to process and upload media from {media_url}: {e}")
        # In a real app, you might want to return the original URL as fallback
        # or raise the exception depending on requirements.
        return media_url
