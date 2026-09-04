"""
Dashboard analytics routes
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from models import Inspection, Product, Violation, ComplianceResult, InspectionStatus
from schemas import DashboardStats, ViolationCategoryStats, ComplianceTrendPoint
from database import get_db
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get overall dashboard statistics
    """
    # Total counts
    total_inspections = db.query(func.count(Inspection.id)).filter(
        Inspection.is_archived == False
    ).scalar() or 0
    
    total_products = db.query(func.count(Product.id)).filter(
        Product.is_active == True
    ).scalar() or 0
    
    compliant_count = db.query(func.count(Inspection.id)).filter(
        Inspection.compliance_result == ComplianceResult.PASS,
        Inspection.is_archived == False
    ).scalar() or 0
    
    violation_count = db.query(func.count(Inspection.id)).filter(
        Inspection.compliance_result == ComplianceResult.FAIL,
        Inspection.is_archived == False
    ).scalar() or 0
    
    review_count = db.query(func.count(Inspection.id)).filter(
        Inspection.compliance_result == ComplianceResult.REVIEW,
        Inspection.is_archived == False
    ).scalar() or 0
    
    # Compliance percentage
    compliance_percentage = 0.0
    if total_inspections > 0:
        compliance_percentage = (compliant_count / total_inspections) * 100
    
    # Today's inspections
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    inspections_today = db.query(func.count(Inspection.id)).filter(
        Inspection.created_at >= today_start,
        Inspection.is_archived == False
    ).scalar() or 0
    
    return DashboardStats(
        total_inspections=total_inspections,
        total_products=total_products,
        compliant_count=compliant_count,
        violation_count=violation_count,
        review_count=review_count,
        compliance_percentage=round(compliance_percentage, 1),
        inspections_today=inspections_today
    )


@router.get("/violations", response_model=List[ViolationCategoryStats])
async def get_violations_by_category(db: Session = Depends(get_db)):
    """
    Get violation statistics by category
    """
    violations = db.query(
        Violation.violation_type,
        func.count(Violation.id).label('count')
    ).group_by(Violation.violation_type).all()
    
    total_violations = sum(v.count for v in violations) or 1
    
    result = []
    for violation_type, count in violations:
        result.append(ViolationCategoryStats(
            category=violation_type or "Unknown",
            count=count,
            percentage=round((count / total_violations) * 100, 1)
        ))
    
    return sorted(result, key=lambda x: x.count, reverse=True)


@router.get("/trends", response_model=List[ComplianceTrendPoint])
async def get_compliance_trends(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """
    Get compliance trends over time
    """
    trend_data = []
    
    for i in range(days, 0, -1):
        date = datetime.utcnow() - timedelta(days=i)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)
        
        total = db.query(func.count(Inspection.id)).filter(
            Inspection.created_at >= date_start,
            Inspection.created_at < date_end,
            Inspection.is_archived == False
        ).scalar() or 0
        
        compliant = db.query(func.count(Inspection.id)).filter(
            Inspection.created_at >= date_start,
            Inspection.created_at < date_end,
            Inspection.compliance_result == ComplianceResult.PASS,
            Inspection.is_archived == False
        ).scalar() or 0
        
        violations = total - compliant
        
        trend_data.append(ComplianceTrendPoint(
            date=date.strftime("%Y-%m-%d"),
            inspections=total,
            compliant=compliant,
            violations=violations
        ))
    
    return trend_data


@router.get("/recent-inspections")
async def get_recent_inspections(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get recent inspections
    """
    inspections = db.query(Inspection).filter(
        Inspection.is_archived == False
    ).order_by(Inspection.created_at.desc()).limit(limit).all()
    
    result = []
    for inspection in inspections:
        product = inspection.product
        result.append({
            "id": inspection.id,
            "inspection_code": inspection.inspection_code,
            "product_name": product.product_name if product else "Unknown",
            "category": product.category if product else "Unknown",
            "status": inspection.compliance_result,
            "score": inspection.compliance_score,
            "created_at": inspection.created_at.isoformat()
        })
    
    return result


@router.get("/top-violations")
async def get_top_violations(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get most common violations
    """
    violations = db.query(
        Violation.violation_type,
        func.count(Violation.id).label('count')
    ).group_by(Violation.violation_type).order_by(
        func.count(Violation.id).desc()
    ).limit(limit).all()
    
    result = []
    for violation_type, count in violations:
        result.append({
            "type": violation_type or "Unknown",
            "count": count
        })
    
    return result
