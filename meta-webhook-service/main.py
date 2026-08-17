from fastapi import FastAPI, Request, Response, HTTPException, BackgroundTasks, Depends
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from core.security import verify_signature
from services.meta_service import fetch_instagram_media, fetch_facebook_post
from services.storage_service import upload_external_media_to_storage
from services.db_service import create_post_from_meta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Zigo Meta Webhook Service")

VERIFY_TOKEN = os.getenv("HUB_VERIFY_TOKEN", "zigo_secret_token")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")
DEFAULT_AUTHOR_ID = os.getenv("DEFAULT_AUTHOR_ID") # Admin/Teacher ID to assign posts to

@app.get("/api/v1/integrations/meta/webhook")
async def verify_webhook(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
):
    """
    Endpoint for Meta webhook verification.
    Meta sends a GET request here when setting up the webhook.
    """
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully.")
        return int(hub_challenge)
    
    logger.warning("Failed webhook verification attempt.")
    raise HTTPException(status_code=403, detail="Verification failed")


async def process_meta_webhook(payload: dict):
    """
    Background task to process the incoming webhook payload.
    Downloads media and saves to DB.
    """
    try:
        object_type = payload.get("object")
        entries = payload.get("entry", [])
        
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                media_id = value.get("media_id") or value.get("post_id")
                
                if not media_id:
                    continue
                
                media_data = None
                # Fetch data from Meta based on object type (instagram vs page)
                if object_type == "instagram":
                    media_data = await fetch_instagram_media(media_id, META_ACCESS_TOKEN)
                elif object_type == "page":
                    media_data = await fetch_facebook_post(media_id, META_ACCESS_TOKEN)
                
                if media_data:
                    # Determine URL to download (fallback to thumbnail if video)
                    media_url = media_data.get("media_url") or media_data.get("full_picture")
                    
                    if media_url:
                        # Upload to S3/R2
                        permanent_url = await upload_external_media_to_storage(media_url)
                        media_data["permanent_media_url"] = permanent_url
                    
                    # Save to Database
                    await create_post_from_meta(media_data, DEFAULT_AUTHOR_ID)
                    
    except Exception as e:
        logger.error(f"Error processing webhook payload: {e}")


@app.post("/api/v1/integrations/meta/webhook", dependencies=[Depends(verify_signature)])
async def handle_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint to receive webhook events from Meta.
    Verifies signature via dependency, then processes payload in background.
    """
    payload = await request.json()
    logger.info(f"Received webhook payload: {payload}")
    
    # Send to background task to avoid timeout on Meta's end
    background_tasks.add_task(process_meta_webhook, payload)
    
    return {"status": "success"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
