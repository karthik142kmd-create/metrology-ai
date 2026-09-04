"""
Reports generation routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from models import Inspection, ComplianceReport
from database import get_db
from config import settings
from services.report_service import ReportGenerator
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{inspection_id}")
async def generate_report(
    inspection_id: int,
    include_images: bool = True,
    include_evidence: bool = True,
    db: Session = Depends(get_db)
):
    """
    Generate compliance report PDF
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    try:
        # Generate PDF
        report_generator = ReportGenerator()
        pdf_path = report_generator.generate_report(
            inspection=inspection,
            include_images=include_images,
            include_evidence=include_evidence,
            db=db
        )
        
        if not os.path.exists(pdf_path):
            raise Exception("PDF generation failed")
        
        # Store report record
        report = ComplianceReport(
            inspection_id=inspection_id,
            report_path=pdf_path,
            generated_by=1,  # TODO: Get from JWT
            disclaimer="This report represents an AI-assisted preliminary screening. Final legal determination rests with the authorized Legal Metrology authority."
        )
        
        db.add(report)
        db.commit()
        
        return {
            "status": "generated",
            "report_path": pdf_path,
            "inspection_id": inspection_id
        }
    
    except Exception as e:
        logger.error(f"Report generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}"
        )


@router.get("/{inspection_id}/download")
async def download_report(
    inspection_id: int,
    db: Session = Depends(get_db)
):
    """
    Download inspection report
    """
    report = db.query(ComplianceReport).filter(
        ComplianceReport.inspection_id == inspection_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    if not os.path.exists(report.report_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file not found"
        )
    
    return FileResponse(
        path=report.report_path,
        filename=f"inspection_{inspection_id}_report.pdf",
        media_type="application/pdf"
    )
