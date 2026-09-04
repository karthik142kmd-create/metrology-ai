"""
Authentication routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from models import User, UserRole
from database import get_db
from services.auth_service import AuthService
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
@router.post("/register/", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account for packaged commodity compliance scanning
    """
    clean_email = request.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    hashed_pwd = AuthService.hash_password(request.password)
    role_mapping = {
        "inspector": UserRole.INSPECTOR,
        "admin": UserRole.ADMIN,
        "consumer": UserRole.CONSUMER
    }
    req_role = (request.role or "inspector").lower()
    user_role = role_mapping.get(req_role, UserRole.CONSUMER)
    
    new_user = User(
        email=clean_email,
        hashed_password=hashed_pwd,
        full_name=request.full_name.strip(),
        role=user_role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    role_str = new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role)
    
    access_token = AuthService.create_access_token(
        data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "role": role_str
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": role_str
        }
    }


@router.get("/register", tags=["Auth"])
@router.get("/register/", include_in_schema=False)
async def register_info():
    """Information for register endpoint"""
    return {
        "status": "active",
        "endpoint": "/api/auth/register",
        "method_expected": "POST",
        "message": "Auth register endpoint is active. Please submit a POST request with full_name, email, password, and role."
    }


@router.post("/login", response_model=TokenResponse, tags=["Auth"])
@router.post("/login/", response_model=TokenResponse, include_in_schema=False)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint
    Returns JWT token if credentials are valid
    """
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user or not AuthService.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create token
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    access_token = AuthService.create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": role_str
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": role_str
        }
    }


@router.get("/login", tags=["Auth"])
@router.get("/login/", include_in_schema=False)
async def login_info():
    """Information for login endpoint"""
    return {
        "status": "active",
        "endpoint": "/api/auth/login",
        "method_expected": "POST",
        "message": "Auth login endpoint is active. Please submit a POST request with email and password."
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = None, db: Session = Depends(get_db)):
    """
    Get current logged-in user
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user
