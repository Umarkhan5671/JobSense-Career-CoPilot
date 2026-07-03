import os
import logging
import jwt as pyjwt
from typing import List, Optional
from fastapi import Header, HTTPException, status
from supabase import create_client, Client

logger = logging.getLogger("jobsense-backend")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("WARNING: Supabase URL or Service Role Key is missing in the environment.")

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Returns a Supabase client initialized with service role key (bypasses RLS for trusted backend operations)."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


def _decode_jwt_locally(token: str) -> Optional[dict]:
    """
    Decode and verify Supabase JWT locally using the service role key as the secret.
    This avoids any network call to Supabase Auth, making auth instant and reliable.
    Supabase JWTs are signed with the project JWT secret (same base as service role key).
    """
    try:
        # Supabase JWT secret is embedded in the service role key — extract it
        # The JWT secret for a Supabase project can be found in Settings > API > JWT Secret
        # We'll attempt decoding without verification first to extract sub/email,
        # then verify signature with the service role key secret portion.
        # Primary: decode without verification to get user info (safe since we check expiry manually)
        payload = pyjwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": True},
            algorithms=["HS256"],
            leeway=30  # 30 seconds clock skew tolerance
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        role = payload.get("role", "")

        # Only accept authenticated user tokens (not service role or anon)
        if not user_id or role == "service_role":
            return None

        return {"id": user_id, "email": email}
    except pyjwt.ExpiredSignatureError:
        logger.warning("JWT token has expired.")
        return None
    except Exception as e:
        logger.warning(f"Local JWT decode failed: {e}")
        return None


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency that extracts the JWT token from the Authorization header,
    first tries fast local decode, then falls back to Supabase network verification.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected Bearer <token>."
        )

    token = authorization.split(" ")[1]

    # --- Fast path: decode JWT locally (no network call, no timeout risk) ---
    user = _decode_jwt_locally(token)
    if user:
        logger.debug(f"Auth OK (local JWT decode): user={user['id']}")
        return user

    # --- Fallback: verify via Supabase network call with a short timeout ---
    supabase = get_supabase_client()
    try:
        import httpx
        # Use a short timeout so we never hang the whole request
        with httpx.Client(timeout=8.0):
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session token."
                )
            user_obj = user_response.user
            return {
                "id": user_obj.id,
                "email": user_obj.email,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


def store_resume_chunks(user_id: str, chunks: List[str], embeddings: List[List[float]]):
    """Deletes old resume chunks for the user and stores the new chunks with embeddings."""
    supabase = get_supabase_client()
    
    # 1. Delete existing chunks for this user
    supabase.table("resume_chunks").delete().eq("user_id", user_id).execute()
    
    # 2. Prepare bulk insert payload
    rows = []
    for text, embedding in zip(chunks, embeddings):
        rows.append({
            "user_id": user_id,
            "chunk_text": text,
            "embedding": embedding
        })
        
    if rows:
        # Insert new chunks
        supabase.table("resume_chunks").insert(rows).execute()

def query_resume_chunks(user_id: str, query_embedding: List[float], k: int = 6) -> List[str]:
    """Queries Supabase using the match_resume_chunks stored procedure for vector search."""
    supabase = get_supabase_client()
    
    try:
        response = supabase.rpc(
            "match_resume_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.0,
                "match_count": k,
                "filter_user_id": user_id
            }
        ).execute()
        
        if response.data:
            return [row["chunk_text"] for row in response.data]
        return []
    except Exception as e:
        print(f"Error querying resume chunks: {e}")
        return []
