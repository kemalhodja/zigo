import httpx
import os
import logging

logger = logging.getLogger(__name__)

GRAPH_API_URL = "https://graph.facebook.com/v19.0"

async def fetch_instagram_media(media_id: str, access_token: str) -> dict:
    """
    Fetches Instagram media details using Meta Graph API.
    """
    url = f"{GRAPH_API_URL}/{media_id}"
    params = {
        "fields": "id,media_type,media_url,caption,permalink,timestamp,username,thumbnail_url",
        "access_token": access_token
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Error fetching IG media {media_id}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching IG media {media_id}: {e}")
            raise

async def fetch_facebook_post(post_id: str, access_token: str) -> dict:
    """
    Fetches Facebook post details using Meta Graph API.
    """
    url = f"{GRAPH_API_URL}/{post_id}"
    params = {
        "fields": "id,message,full_picture,permalink_url,created_time,from",
        "access_token": access_token
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Error fetching FB post {post_id}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching FB post {post_id}: {e}")
            raise
