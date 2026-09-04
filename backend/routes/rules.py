"""
Compliance rules management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from models import ComplianceRule
from schemas import ComplianceRuleCreate, ComplianceRuleUpdate, ComplianceRuleResponse
from database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[ComplianceRuleResponse])
async def get_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category: str = Query(None),
    enabled: bool = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all compliance rules
    """
    query = db.query(ComplianceRule)
    
    if category:
        query = query.filter(ComplianceRule.categories.like(f"%{category}%"))
    
    if enabled is not None:
        query = query.filter(ComplianceRule.enabled == enabled)
    
    rules = query.offset(skip).limit(limit).all()
    
    return rules


@router.get("/{rule_id}", response_model=ComplianceRuleResponse)
async def get_rule(rule_id: str, db: Session = Depends(get_db)):
    """
    Get specific rule
    """
    rule = db.query(ComplianceRule).filter(ComplianceRule.rule_id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    return rule


@router.post("/", response_model=ComplianceRuleResponse)
async def create_rule(
    request: ComplianceRuleCreate,
    db: Session = Depends(get_db)
):
    """
    Create new rule
    """
    # Check if rule already exists
    existing = db.query(ComplianceRule).filter(
        ComplianceRule.rule_id == request.rule_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rule already exists"
        )
    
    rule = ComplianceRule(
        rule_id=request.rule_id,
        name=request.name,
        description=request.description,
        field=request.field,
        mandatory=request.mandatory,
        validation_type=request.validation_type,
        validation_pattern=request.validation_pattern,
        severity=request.severity,
        points=request.points,
        categories=request.categories,
        version=request.version
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return rule


@router.put("/{rule_id}", response_model=ComplianceRuleResponse)
async def update_rule(
    rule_id: str,
    request: ComplianceRuleUpdate,
    db: Session = Depends(get_db)
):
    """
    Update rule
    """
    rule = db.query(ComplianceRule).filter(ComplianceRule.rule_id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    
    db.commit()
    db.refresh(rule)
    
    return rule


@router.delete("/{rule_id}")
async def delete_rule(rule_id: str, db: Session = Depends(get_db)):
    """
    Delete rule
    """
    rule = db.query(ComplianceRule).filter(ComplianceRule.rule_id == rule_id).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    db.delete(rule)
    db.commit()
    
    return {"status": "deleted"}
