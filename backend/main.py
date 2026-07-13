from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)
from api.admin import router as admin_router
from api.dashboard import router as dashboard_router
import models
from api.chat import router as chat_router
from api.contracts import (
    router as contracts_router,
)
from api.auth import router as auth_router
from api.search import (
    router as search_router,
)
from database import Base, engine

Base.metadata.create_all(
    bind=engine
)

app = FastAPI(
    title="LegalAI Contract Review API",
    description=(
        "AI-powered legal contract "
        "analysis platform"
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    contracts_router
)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(
    search_router
)

app.include_router(
    chat_router
)


@app.get("/")
def root():
    return {
        "message": (
            "LegalAI API is running"
        ),
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }