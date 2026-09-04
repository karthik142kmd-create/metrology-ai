"""
Products routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from models import Product, Inspection
from schemas import ProductCreate, ProductUpdate, ProductResponse
from database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all products with optional filtering
    """
    query = db.query(Product).filter(Product.is_active == True)
    
    if category:
        query = query.filter(Product.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.product_name.ilike(search_term)) |
            (Product.manufacturer.ilike(search_term))
        )
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Get product by ID
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.post("/", response_model=ProductResponse)
async def create_product(
    request: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Create new product
    """
    # Check if product already exists
    existing = db.query(Product).filter(
        Product.product_name == request.product_name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already exists"
        )
    
    product = Product(
        product_name=request.product_name,
        category=request.category,
        manufacturer=request.manufacturer,
        mrp=request.mrp,
        net_quantity=request.net_quantity,
        description=request.description
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    request: ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Update product
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Soft delete product
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.is_active = False
    db.commit()
    
    return {"status": "deleted"}
