# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import (
    engine,
    Base
)
from app import models
from app.routes import user
Base.metadata.create_all(
    bind=engine
)


app = FastAPI(
    title="SVNIT Dashboard API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

app.include_router(
    user.router
)

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)

@app.get("/api/")
def home():

    return {
        "message":"Server Running"
    }

@app.get("/health")
def health():
    return {
        "status":"healthy"
    }