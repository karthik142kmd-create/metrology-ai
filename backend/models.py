"""
SQLAlchemy database models for MetrologyAI
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class UserRole(str, enum.Enum):
    """User roles — single consumer role for packaged commodity consumers"""
    CONSUMER = "CONSUMER"
    # Legacy aliases kept for backward compatibility with existing DB data
    ADMIN = "ADMIN"
    INSPECTOR = "INSPECTOR"


class InspectionStatus(str, enum.Enum):
    """Inspection status"""
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class ComplianceResult(str, enum.Enum):
    """Compliance result"""
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"


class RuleStatus(str, enum.Enum):
    """Rule validation status"""
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True)
    full_name = Column(String(255))
    hashed_password = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.INSPECTOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    inspections = relationship("Inspection", back_populates="inspector")


class Product(Base):
    """Product model"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True)
    product_name = Column(String(255), index=True)
    category = Column(String(100))  # Food, Beverage, Cosmetic, Household, Electronic
    manufacturer = Column(String(255))
    mrp = Column(String(50))
    net_quantity = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    inspections = relationship("Inspection", back_populates="product")


class Inspection(Base):
    """Inspection model"""
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True)
    inspection_code = Column(String(50), unique=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(InspectionStatus), default=InspectionStatus.DRAFT)
    compliance_score = Column(Float, default=0.0)
    compliance_result = Column(Enum(ComplianceResult), default=ComplianceResult.REVIEW)
    total_rules = Column(Integer, default=0)
    passed_rules = Column(Integer, default=0)
    failed_rules = Column(Integer, default=0)
    review_rules = Column(Integer, default=0)
    notes = Column(Text)
    officer_remarks = Column(Text)
    extracted_data = Column(JSON)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    product = relationship("Product", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")
    images = relationship("InspectionImage", back_populates="inspection")
    extracted_declarations = relationship("ExtractedDeclaration", back_populates="inspection")
    rule_results = relationship("RuleResult", back_populates="inspection")
    violations = relationship("Violation", back_populates="inspection")


class InspectionImage(Base):
    """Inspection image model"""
    __tablename__ = "inspection_images"
    
    id = Column(Integer, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    image_path = Column(String(500))
    image_type = Column(String(50))  # front, back, side, top, bottom
    file_name = Column(String(255))
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="images")


class ExtractedDeclaration(Base):
    """Extracted declarations from OCR"""
    __tablename__ = "extracted_declarations"
    
    id = Column(Integer, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    field_name = Column(String(100), index=True)  # product_name, manufacturer, etc
    extracted_value = Column(Text)
    ocr_confidence = Column(Float)
    bounding_box = Column(JSON)  # {"x": 0, "y": 0, "width": 100, "height": 50}
    image_id = Column(Integer, ForeignKey("inspection_images.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="extracted_declarations")


class ComplianceRule(Base):
    """Compliance rule definition"""
    __tablename__ = "compliance_rules"
    
    id = Column(Integer, primary_key=True)
    rule_id = Column(String(50), unique=True, index=True)  # LM-MRP-001
    name = Column(String(255))
    description = Column(Text)
    field = Column(String(100))
    mandatory = Column(Boolean, default=True)
    validation_type = Column(String(50))  # exists, pattern, format, etc
    validation_pattern = Column(String(500), nullable=True)
    severity = Column(String(50))  # HIGH, MEDIUM, LOW
    points = Column(Integer, default=10)
    categories = Column(JSON)  # ["Food", "Beverage"]
    enabled = Column(Boolean, default=True)
    version = Column(String(50))  # "2011", "2023"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RuleResult(Base):
    """Result of rule validation"""
    __tablename__ = "rule_results"
    
    id = Column(Integer, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    rule_id = Column(String(50), ForeignKey("compliance_rules.rule_id"))
    status = Column(Enum(RuleStatus), default=RuleStatus.REVIEW)
    confidence = Column(Float)
    message = Column(Text)
    evidence = Column(Text)
    detected_value = Column(Text)
    expected_value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="rule_results")


class Violation(Base):
    """Detected violation"""
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    rule_id = Column(String(50), ForeignKey("compliance_rules.rule_id"))
    violation_type = Column(String(100))
    description = Column(Text)
    severity = Column(String(50))  # HIGH, MEDIUM, LOW
    confidence = Column(Float)
    evidence = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    inspection = relationship("Inspection", back_populates="violations")


class ComplianceReport(Base):
    """Generated compliance report"""
    __tablename__ = "compliance_reports"
    
    id = Column(Integer, primary_key=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    report_path = Column(String(500))
    generated_by = Column(Integer, ForeignKey("users.id"))
    report_data = Column(JSON)
    disclaimer = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    """Audit log for tracking changes"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255))
    entity_type = Column(String(100))  # Inspection, Product, User
    entity_id = Column(Integer)
    old_value = Column(JSON)
    new_value = Column(JSON)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
