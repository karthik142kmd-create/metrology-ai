"""
Inspections routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid
from models import Inspection, Product, InspectionImage, User, InspectionStatus, ComplianceResult
from schemas import InspectionCreate, InspectionUpdate, InspectionResponse, InspectionDetailResponse
from database import get_db
from config import settings
from services.ocr_service import OCRService
from services.extraction_service import DeclarationExtractor
from services.rule_engine import RuleValidator, ComplianceScorer, get_default_rules
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=InspectionResponse)
async def create_inspection(
    request: InspectionCreate,
    db: Session = Depends(get_db)
):
    """
    Create new inspection
    """
    # Verify product exists
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Create inspection code
    inspection_code = f"INS-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    inspection = Inspection(
        inspection_code=inspection_code,
        product_id=request.product_id,
        inspector_id=1,  # TODO: Get from JWT token
        status=InspectionStatus.DRAFT
    )
    
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    
    return inspection


@router.get("/", response_model=List[InspectionResponse])
async def get_inspections(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all inspections with optional filtering
    """
    query = db.query(Inspection).filter(Inspection.is_archived == False)
    
    if status_filter:
        query = query.filter(Inspection.status == status_filter)
    
    if product_id:
        query = query.filter(Inspection.product_id == product_id)
    
    inspections = query.order_by(Inspection.created_at.desc()).offset(skip).limit(limit).all()
    
    return inspections


@router.get("/{inspection_id}", response_model=InspectionDetailResponse)
async def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    """
    Get inspection details
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    return inspection


@router.post("/{inspection_id}/images")
async def upload_inspection_images(
    inspection_id: int,
    files: List[UploadFile] = File(...),
    image_type: str = Query("general"),
    db: Session = Depends(get_db)
):
    """
    Upload images for inspection
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    uploaded_images = []
    
    for file in files:
        # Validate file
        if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {file.content_type}"
            )
        
        # Save file
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in settings.allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed: {file_extension}"
            )
        
        filename = f"{inspection_id}_{datetime.utcnow().timestamp()}_{uuid.uuid4()}.{file_extension}"
        filepath = os.path.join(settings.upload_dir, filename)
        
        # Read and save file
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        
        # Create image record
        image = InspectionImage(
            inspection_id=inspection_id,
            image_path=filepath,
            image_type=image_type,
            file_name=filename,
            file_size=len(contents)
        )
        
        db.add(image)
        uploaded_images.append({
            "id": image.id,
            "filename": filename,
            "size": len(contents)
        })
    
    db.commit()
    
    return {"uploaded": uploaded_images}


@router.post("/{inspection_id}/scan")
async def scan_inspection(
    inspection_id: int,
    db: Session = Depends(get_db)
):
    """
    Run OCR and analysis on inspection images
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    images = db.query(InspectionImage).filter(
        InspectionImage.inspection_id == inspection_id
    ).all()
    
    if not images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No images uploaded for inspection"
        )
    
    # Process images
    all_ocr_results = {}
    all_declarations = {}
    
    for image in images:
        try:
            # OCR
            ocr_result = await OCRService.extract_text(image.image_path)
            all_ocr_results[image.id] = ocr_result
            
            # Extract declarations
            declarations = DeclarationExtractor.extract_all(ocr_result)
            all_declarations[image.id] = declarations
            
        except Exception as e:
            logger.error(f"Error processing image {image.id}: {str(e)}")
    
    # Merge declarations (use highest confidence)
    merged_declarations = {}
    for image_id, declarations in all_declarations.items():
        for field_name, declaration in declarations.items():
            if field_name not in merged_declarations:
                merged_declarations[field_name] = declaration
            elif declaration['confidence'] > merged_declarations[field_name]['confidence']:
                merged_declarations[field_name] = declaration
    
    # Store merged declarations
    from models import ExtractedDeclaration
    for field_name, declaration in merged_declarations.items():
        if declaration['value'] is not None:
            extracted = ExtractedDeclaration(
                inspection_id=inspection_id,
                field_name=field_name,
                extracted_value=declaration['value'],
                ocr_confidence=declaration['confidence'],
                bounding_box=declaration.get('bounding_box')
            )
            db.add(extracted)
    
    # Run rule validation
    rules = get_default_rules()
    rule_results = []
    violations = []
    
    from models import RuleResult, Violation, ComplianceRule
    
    for rule in rules:
        if not rule['enabled']:
            continue
        
        field_name = rule['field']
        declaration = merged_declarations.get(field_name, {})
        extracted_value = declaration.get('value')
        confidence = declaration.get('confidence', 0.0)
        
        # Validate
        result = RuleValidator.validate_declaration(
            field_name=field_name,
            extracted_value=extracted_value,
            confidence=confidence,
            rule=rule
        )
        
        # Store rule result
        rule_result = RuleResult(
            inspection_id=inspection_id,
            rule_id=rule['rule_id'],
            status=result['status'],
            confidence=result['confidence'],
            message=result['message'],
            evidence=result.get('evidence'),
            detected_value=result.get('detected_value'),
            expected_value=result.get('expected_value')
        )
        db.add(rule_result)
        rule_results.append(result)
        
        # Create violation if failed
        if result['status'] == 'FAIL' or result['status'] == 'REVIEW':
            violation = Violation(
                inspection_id=inspection_id,
                rule_id=rule['rule_id'],
                violation_type=field_name,
                description=result['message'],
                severity=rule['severity'],
                confidence=result['confidence'],
                evidence=result.get('evidence')
            )
            db.add(violation)
            violations.append(violation)
    
    # Calculate compliance score
    score_data = ComplianceScorer.calculate_score(rule_results)
    
    # Run AI compliance assessment
    ai_assessment = None
    try:
        from services.ai_compliance_service import AIComplianceService
        ai_assessment = await AIComplianceService.assess_compliance(
            declarations=merged_declarations,
            category=inspection.product.category if inspection.product else "General",
            product_name=inspection.product.product_name if inspection.product else None,
            existing_rule_results=rule_results
        )
    except Exception as ai_err:
        logger.warning(f"AI compliance check error during scan: {ai_err}")

    inspection.compliance_score = score_data['compliance_score']
    inspection.compliance_result = score_data['compliance_result']
    inspection.total_rules = score_data['total_rules']
    inspection.passed_rules = score_data['passed_rules']
    inspection.failed_rules = score_data['failed_rules']
    inspection.review_rules = score_data['review_rules']
    inspection.status = InspectionStatus.COMPLETED
    
    # Save both merged declarations and ai assessment
    extracted_payload = {
        "declarations": merged_declarations,
        "ai_assessment": ai_assessment
    }
    inspection.extracted_data = extracted_payload
    
    db.commit()
    
    return {
        "inspection_id": inspection_id,
        "status": "completed",
        "compliance_score": inspection.compliance_score,
        "compliance_result": inspection.compliance_result,
        "total_rules": inspection.total_rules,
        "passed_rules": inspection.passed_rules,
        "failed_rules": inspection.failed_rules,
        "review_rules": inspection.review_rules,
        "violations": len(violations),
        "ai_assessment": ai_assessment
    }


@router.put("/{inspection_id}", response_model=InspectionResponse)
async def update_inspection(
    inspection_id: int,
    request: InspectionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update inspection
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inspection, key, value)
    
    db.commit()
    db.refresh(inspection)
    
    return inspection
