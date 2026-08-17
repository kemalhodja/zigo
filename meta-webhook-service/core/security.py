import hmac
import hashlib
from fastapi import Request, HTTPException
import os

APP_SECRET = os.getenv("META_APP_SECRET", "default_secret")

async def verify_signature(request: Request):
    """
    Verifies the X-Hub-Signature-256 header sent by Meta.
    """
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=401, detail="Missing X-Hub-Signature-256 header")

    body = await request.body()
    
    # Calculate expected signature
    expected_hash = hmac.new(
        key=APP_SECRET.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    expected_signature = f"sha256={expected_hash}"
    
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    return True
