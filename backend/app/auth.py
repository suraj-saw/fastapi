# backend/app/auth.py

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
import uuid
import redis

from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

ACCESS_TOKEN_EXPIRE_MINUTES = 20
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(password, hashed_password):
    return pwd_context.verify(password, hashed_password)


def create_token_pair(data: dict) -> tuple[str, str]:
    """
    Always creates BOTH tokens together with the SAME session_id.
    This is the only way tokens should ever be created.
    A single session_id ties the access token and refresh token together.
    """
    session_id = str(uuid.uuid4())
    user_id = data.get("id")

    # Store this session_id as the one valid session for this user
    # Any previous session_id is overwritten — instant invalidation
    ttl = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    redis_client.setex(f"session:{user_id}", ttl, session_id)

    base_payload = {**data, "session_id": session_id}

    # Access token
    access_payload = {
        **base_payload,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm=ALGORITHM)

    # Refresh token
    refresh_payload = {
        **base_payload,
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }
    refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm=ALGORITHM)

    return access_token, refresh_token


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def is_session_valid(token: str) -> bool:
    """
    Checks the token's session_id against what is currently
    stored in Redis for that user.
    Works for both access tokens and refresh tokens.
    Called on EVERY request — this is what makes invalidation immediate.
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("id")
        token_session_id = payload.get("session_id")

        if not user_id or not token_session_id:
            return False

        stored = redis_client.get(f"session:{user_id}")
        return stored == token_session_id

    except JWTError:
        return False


def blacklist_refresh_token(token: str):
    """Blacklist a refresh token and clear the user's session."""
    try:
        payload = decode_token(token)
        exp = payload.get("exp")
        user_id = payload.get("id")
        ttl = int(exp - datetime.utcnow().timestamp())

        if ttl > 0:
            redis_client.setex(f"blacklist:{token}", ttl, "revoked")

        if user_id:
            redis_client.delete(f"session:{user_id}")

    except JWTError:
        pass


def is_token_blacklisted(token: str) -> bool:
    return redis_client.exists(f"blacklist:{token}") == 1