"""
MetrologyAI - AI-Assisted Packaged Commodity Compliance Inspector
Main FastAPI application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from config import settings
from database import engine, Base, get_db
from routes import auth, inspections, products, rules, dashboard, reports, analysis
from models import User, Product, Inspection
from seed import seed_initial_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management
    """
    # Startup
    logger.info("Starting MetrologyAI application...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    
    # Seed initial data
    try:
        seed_initial_data()
        logger.info("Initial data seeded successfully")
    except Exception as e:
        logger.warning(f"Could not seed data (may already exist): {str(e)}")
    
    logger.info("MetrologyAI application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MetrologyAI application...")


# Create FastAPI app
app = FastAPI(
    title="MetrologyAI",
    description="AI-Assisted Packaged Commodity Compliance Inspector",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware — supports multi-device access (LAN IPs, Wi-Fi devices, Vercel, localhost)
_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "testserver", "*"]
)


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["Inspections"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(rules.router, prefix="/api/rules", tags=["Rules"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/", tags=["Health"], operation_id="root_get")
@app.head("/", include_in_schema=False)
@app.post("/", include_in_schema=False)
async def root():
    """Health check endpoint"""
    return {
        "status": "active",
        "application": "MetrologyAI",
        "subtitle": "AI-Assisted Packaged Commodity Compliance Inspection",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health", tags=["Health"], operation_id="health_check_get")
@app.head("/health", include_in_schema=False)
@app.post("/health", include_in_schema=False)
async def health():
    """Health check for monitoring"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
