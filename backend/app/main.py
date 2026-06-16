# backend/app/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine, Base
from app import models
from app.routes import user

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SVNIT Dashboard API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

app.include_router(user.router)

# Load allowed origins from .env — comma separated
# e.g. ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

if not allowed_origins:
    raise RuntimeError(
        "ALLOWED_ORIGINS is not set in .env. "
        "Set it to a comma-separated list of allowed frontend origins."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/api/")
def home():
    return {"message": "Server Running"}


@app.get("/health")
def health():
    return {"status": "healthy"}