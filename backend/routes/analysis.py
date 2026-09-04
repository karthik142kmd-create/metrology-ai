"""
Analysis routes for OCR, extraction, and validation
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from schemas import OCRResult, DeclarationExtractionResult
from database import get_db
from services.ocr_service import OCRService
from services.extraction_service import DeclarationExtractor
from config import settings
import os
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/ocr")
async def ocr_extract(file: UploadFile = File(...)):
    """
    Extract text from image using OCR
    """
    # Validate file
    if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}"
        )
    
    # Save temporary file
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed: {file_extension}"
        )
    
    filename = f"temp_{uuid.uuid4()}.{file_extension}"
    filepath = os.path.join(settings.upload_dir, filename)
    
    try:
        contents = await file.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        
        # Run OCR
        ocr_result = await OCRService.extract_text(filepath)
        
        return {
            "status": "success",
            "ocr_result": ocr_result
        }
    
    except Exception as e:
        logger.error(f"OCR error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {str(e)}"
        )
    
    finally:
        # Clean up
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass


@router.post("/extract-declarations")
async def extract_declarations(ocr_data: dict):
    """
    Extract structured declarations from OCR data
    """
    try:
        declarations = DeclarationExtractor.extract_all(ocr_data)
        
        return {
            "status": "success",
            "declarations": declarations
        }
    
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Declaration extraction failed: {str(e)}"
        )


@router.post("/validate")
async def validate_declarations(
    extraction_result: dict,
    category: str,
    db: Session = Depends(get_db)
):
    """
    Validate declarations against rules
    """
    from services.rule_engine import RuleValidator, ComplianceScorer, get_default_rules
    
    try:
        rules = get_default_rules()
        
        # Filter rules by category
        applicable_rules = [r for r in rules if category in r.get('categories', [])]
        
        rule_results = []
        for rule in applicable_rules:
            field_name = rule['field']
            declaration = extraction_result.get(field_name, {})
            extracted_value = declaration.get('value')
            confidence = declaration.get('confidence', 0.0)
            
            result = RuleValidator.validate_declaration(
                field_name=field_name,
                extracted_value=extracted_value,
                confidence=confidence,
                rule=rule
            )
            rule_results.append(result)
        
        # Calculate score
        score_data = ComplianceScorer.calculate_score(rule_results)
        
        return {
            "status": "success",
            "rule_results": rule_results,
            "compliance_score": score_data['compliance_score'],
            "compliance_result": score_data['compliance_result'],
            "summary": {
                "total_rules": score_data['total_rules'],
                "passed_rules": score_data['passed_rules'],
                "failed_rules": score_data['failed_rules'],
                "review_rules": score_data['review_rules']
            }
        }
    
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )


@router.post("/ai-compliance")
async def ai_compliance_assessment(request: dict):
    """
    Perform deep AI legal metrology compliance assessment on declarations
    """
    from services.ai_compliance_service import AIComplianceService
    
    declarations = request.get("declarations", {})
    category = request.get("category", "General")
    product_name = request.get("product_name")
    
    try:
        assessment = await AIComplianceService.assess_compliance(
            declarations=declarations,
            category=category,
            product_name=product_name
        )
        return assessment
    except Exception as e:
        logger.error(f"AI compliance error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Compliance assessment failed: {str(e)}"
        )


@router.post("/quick-analyze")
async def quick_analyze_image(
    file: UploadFile = File(...),
    category: str = "General"
):
    """
    Direct 1-click analysis: Uploads label image and immediately verifies compliance of all
    mandatory Government Legal Metrology declarations, computing the overall Compliance Rate.
    """
    from services.rule_engine import RuleValidator, ComplianceScorer, get_default_rules
    from services.ai_compliance_service import AIComplianceService

    # Validate file extension
    file_ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    valid_extensions = ("jpg", "jpeg", "png", "gif", "webp", "bmp")
    if file_ext not in valid_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type .{file_ext}. Please upload a JPG, PNG, WEBP, or BMP image."
        )

    filename = f"quick_{uuid.uuid4()}.{file_ext}"
    filepath = os.path.join(settings.upload_dir, filename)

    try:
        contents = await file.read()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 15MB limit"
            )

        with open(filepath, "wb") as f:
            f.write(contents)

        # 1. Extract OCR text
        ocr_result = await OCRService.extract_text(filepath)

        # 2. Extract structured government declarations
        declarations = DeclarationExtractor.extract_all(ocr_result)

        # 3. Validate against Legal Metrology Rules (2011)
        rules = get_default_rules()
        rule_results = []
        
        for rule in rules:
            if not rule.get('enabled', True):
                continue
            field_name = rule['field']
            decl = declarations.get(field_name, {})
            extracted_val = decl.get('value')
            confidence = decl.get('confidence', 0.0)

            res = RuleValidator.validate_declaration(
                field_name=field_name,
                extracted_value=extracted_val,
                confidence=confidence,
                rule=rule
            )
            # Attach rule metadata for rich UI display
            res['rule_name'] = rule.get('name')
            res['legal_reference'] = rule.get('legal_reference')
            res['penalty_info'] = rule.get('penalty_info')
            res['description'] = rule.get('description')
            res['field'] = field_name
            res['mandatory'] = rule.get('mandatory', True)
            res['points'] = rule.get('points', 10)
            res['severity'] = rule.get('severity', 'MEDIUM')
            rule_results.append(res)

        # 4. Compute Compliance Rate & Result
        score_data = ComplianceScorer.calculate_score(rule_results)

        # 5. Generate AI legal assessment & remedies
        product_name = declarations.get('product_name', {}).get('value') or file.filename
        try:
            ai_assessment = await AIComplianceService.assess_compliance(
                declarations=declarations,
                category=category,
                product_name=product_name,
                existing_rule_results=rule_results
            )
        except Exception as ai_err:
            logger.warning(f"AI assessment skipped or failed: {ai_err}")
            ai_assessment = None

        return {
            "status": "success",
            "filename": file.filename,
            "ocr_text": ocr_result.get("full_text", ""),
            "text_blocks": ocr_result.get("text_blocks", []),
            "ocr_confidence": ocr_result.get("overall_confidence", 0.9),
            "declarations": declarations,
            "rule_results": rule_results,
            "compliance_rate": score_data["compliance_rate"],
            "compliance_score": score_data["compliance_score"],
            "compliance_result": score_data["compliance_result"],
            "summary": {
                "total_rules": score_data["total_rules"],
                "passed_rules": score_data["passed_rules"],
                "failed_rules": score_data["failed_rules"],
                "review_rules": score_data["review_rules"],
                "earned_points": score_data["earned_points"],
                "total_points": score_data["total_points"]
            },
            "ai_assessment": ai_assessment
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick analyze error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )
    finally:
        # Keep uploaded file or clean up if needed
        # We can keep it so it can be previewed or remove it if temp
        pass

