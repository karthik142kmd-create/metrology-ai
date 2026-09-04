"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== Auth Schemas ====================

class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserResponse(BaseModel):
    """User response"""
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Product Schemas ====================

class ProductCreate(BaseModel):
    """Create product"""
    product_name: str
    category: str
    manufacturer: Optional[str] = None
    mrp: Optional[str] = None
    net_quantity: Optional[str] = None
    description: Optional[str] = None


class ProductUpdate(BaseModel):
    """Update product"""
    product_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    mrp: Optional[str] = None
    net_quantity: Optional[str] = None
    description: Optional[str] = None


class ProductResponse(BaseModel):
    """Product response"""
    id: int
    product_name: str
    category: str
    manufacturer: Optional[str]
    mrp: Optional[str]
    net_quantity: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Inspection Schemas ====================

class InspectionCreate(BaseModel):
    """Create inspection"""
    product_id: int
    category: str


class InspectionUpdate(BaseModel):
    """Update inspection"""
    notes: Optional[str] = None
    officer_remarks: Optional[str] = None
    status: Optional[str] = None


class ExtractedDeclarationResponse(BaseModel):
    """Extracted declaration response"""
    field_name: str
    extracted_value: Optional[str]
    ocr_confidence: float
    bounding_box: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True


class RuleResultResponse(BaseModel):
    """Rule result response"""
    rule_id: str
    status: str
    confidence: float
    message: str
    evidence: Optional[str]
    detected_value: Optional[str]
    expected_value: Optional[str]
    
    class Config:
        from_attributes = True


class ViolationResponse(BaseModel):
    """Violation response"""
    id: int
    rule_id: str
    violation_type: str
    description: str
    severity: str
    confidence: float
    evidence: Optional[str]
    is_resolved: bool
    
    class Config:
        from_attributes = True


class InspectionResponse(BaseModel):
    """Inspection response"""
    id: int
    inspection_code: str
    product_id: int
    inspector_id: int
    status: str
    compliance_score: float
    compliance_result: str
    total_rules: int
    passed_rules: int
    failed_rules: int
    review_rules: int
    notes: Optional[str]
    officer_remarks: Optional[str]
    extracted_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class InspectionDetailResponse(InspectionResponse):
    """Detailed inspection response"""
    extracted_declarations: List[ExtractedDeclarationResponse] = []
    rule_results: List[RuleResultResponse] = []
    violations: List[ViolationResponse] = []


# ==================== Analysis Schemas ====================

class OCRRequest(BaseModel):
    """OCR request"""
    image_path: str
    image_type: Optional[str] = "general"


class OCRResult(BaseModel):
    """OCR result"""
    text: str
    confidence: float
    bounding_boxes: List[Dict[str, Any]]


class DeclarationExtractionResult(BaseModel):
    """Declaration extraction result"""
    product_name: Optional[Dict[str, Any]] = None
    manufacturer: Optional[Dict[str, Any]] = None
    address: Optional[Dict[str, Any]] = None
    net_quantity: Optional[Dict[str, Any]] = None
    mrp: Optional[Dict[str, Any]] = None
    date: Optional[Dict[str, Any]] = None
    consumer_care: Optional[Dict[str, Any]] = None
    country_of_origin: Optional[Dict[str, Any]] = None


class ComplianceValidationResult(BaseModel):
    """Compliance validation result"""
    compliance_score: float
    compliance_result: str
    total_rules: int
    passed_rules: int
    failed_rules: int
    review_rules: int
    rule_results: List[RuleResultResponse] = []
    violations: List[Dict[str, Any]] = []


# ==================== Rule Schemas ====================

class ComplianceRuleCreate(BaseModel):
    """Create compliance rule"""
    rule_id: str
    name: str
    description: str
    field: str
    mandatory: bool = True
    validation_type: str
    validation_pattern: Optional[str] = None
    severity: str = "HIGH"
    points: int = 10
    categories: List[str] = []
    version: str = "2011"


class ComplianceRuleUpdate(BaseModel):
    """Update compliance rule"""
    name: Optional[str] = None
    description: Optional[str] = None
    mandatory: Optional[bool] = None
    validation_type: Optional[str] = None
    validation_pattern: Optional[str] = None
    severity: Optional[str] = None
    points: Optional[int] = None
    enabled: Optional[bool] = None
    categories: Optional[List[str]] = None


class ComplianceRuleResponse(BaseModel):
    """Compliance rule response"""
    id: int
    rule_id: str
    name: str
    description: str
    field: str
    mandatory: bool
    validation_type: str
    severity: str
    points: int
    enabled: bool
    categories: List[str]
    version: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Dashboard Schemas ====================

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_inspections: int
    total_products: int
    compliant_count: int
    violation_count: int
    review_count: int
    compliance_percentage: float
    inspections_today: int
    
    class Config:
        from_attributes = True


class ViolationCategoryStats(BaseModel):
    """Violation category statistics"""
    category: str
    count: int
    percentage: float


class ComplianceTrendPoint(BaseModel):
    """Compliance trend data point"""
    date: str
    inspections: int
    compliant: int
    violations: int


# ==================== Report Schemas ====================

class ReportGenerateRequest(BaseModel):
    """Request to generate report"""
    inspection_id: int
    include_images: bool = True
    include_evidence: bool = True


class ReportResponse(BaseModel):
    """Report response"""
    id: int
    inspection_id: int
    report_path: str
    generated_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
