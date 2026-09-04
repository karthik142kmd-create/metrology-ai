"""
Database seeding with initial sample data
"""

from database import SessionLocal
from models import (
    User, Product, Inspection, ComplianceRule,
    UserRole, InspectionStatus, ComplianceResult
)
from services.auth_service import AuthService
from services.rule_engine import get_default_rules
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def seed_initial_data():
    """Seed database with initial data and guarantee all demo accounts exist"""
    db = SessionLocal()
    
    try:
        # Guarantee demo accounts exist with active status
        demo_accounts = [
            ("inspector@metrology.ai", "Demo Inspector", "inspector123", UserRole.INSPECTOR),
            ("admin@metrology.ai", "Demo Officer / Admin", "admin123", UserRole.ADMIN),
            ("consumer@metrology.ai", "Demo Consumer", "consumer123", UserRole.CONSUMER),
        ]
        
        inspector_user = None
        for email, full_name, password, role in demo_accounts:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    full_name=full_name,
                    hashed_password=AuthService.hash_password(password),
                    role=role,
                    is_active=True
                )
                db.add(user)
                db.flush()
                logger.info(f"Created demo account: {email}")
            else:
                user.hashed_password = AuthService.hash_password(password)
                user.is_active = True
                user.role = role
                db.flush()
            
            if role == UserRole.INSPECTOR or not inspector_user:
                inspector_user = user
                
        db.commit()

        # Check if products already exist
        product_count = db.query(Product).count()
        if product_count > 0:
            logger.info("Products and rules already seeded")
            return
        
        inspector = inspector_user
        
        # Create sample products
        products_data = [
            {
                'product_name': 'ABC Premium Rice',
                'category': 'Food',
                'manufacturer': 'ABC Foods Pvt Ltd',
                'mrp': '₹650',
                'net_quantity': '5 kg',
                'description': 'Premium quality basmati rice'
            },
            {
                'product_name': 'Fresh Cooking Oil',
                'category': 'Food',
                'manufacturer': 'XYZ Oils Ltd',
                'mrp': '₹180',
                'net_quantity': '1 L',
                'description': 'Pure vegetable cooking oil'
            },
            {
                'product_name': 'ABC Biscuits',
                'category': 'Food',
                'manufacturer': 'ABC Foods Pvt Ltd',
                'mrp': '₹50',
                'net_quantity': '200 g',
                'description': 'Crispy digestive biscuits'
            },
            {
                'product_name': 'Premium Shampoo',
                'category': 'Cosmetic',
                'manufacturer': 'Beauty Care Inc',
                'mrp': '₹280',
                'net_quantity': '200 ml',
                'description': 'Hair care shampoo for all hair types'
            },
            {
                'product_name': 'Imported Chocolate',
                'category': 'Food',
                'manufacturer': 'Swiss Chocolate AG',
                'mrp': '₹450',
                'net_quantity': '100 g',
                'description': 'Dark chocolate imported from Switzerland'
            }
        ]
        
        products = []
        for product_data in products_data:
            product = Product(**product_data)
            db.add(product)
            products.append(product)
        
        db.flush()
        
        # Create sample inspections with violations
        inspection_configs = [
            {
                'product_index': 0,
                'status': ComplianceResult.PASS,
                'score': 95,
                'violations': 0
            },
            {
                'product_index': 1,
                'status': ComplianceResult.FAIL,
                'score': 45,
                'violations': 3
            },
            {
                'product_index': 2,
                'status': ComplianceResult.REVIEW,
                'score': 72,
                'violations': 2
            },
            {
                'product_index': 3,
                'status': ComplianceResult.PASS,
                'score': 98,
                'violations': 0
            },
            {
                'product_index': 4,
                'status': ComplianceResult.FAIL,
                'score': 52,
                'violations': 4
            },
            {
                'product_index': 0,
                'status': ComplianceResult.PASS,
                'score': 90,
                'violations': 1
            },
            {
                'product_index': 2,
                'status': ComplianceResult.REVIEW,
                'score': 68,
                'violations': 2
            },
            {
                'product_index': 1,
                'status': ComplianceResult.FAIL,
                'score': 48,
                'violations': 3
            }
        ]
        
        for idx, config in enumerate(inspection_configs):
            inspection_code = f"INS-{datetime.utcnow().strftime('%Y%m%d')}-{str(idx).zfill(4)}"
            
            inspection = Inspection(
                inspection_code=inspection_code,
                product_id=products[config['product_index']].id,
                inspector_id=inspector.id,
                status=InspectionStatus.COMPLETED,
                compliance_score=config['score'],
                compliance_result=config['status'],
                total_rules=9,
                passed_rules=max(1, int(config['score'] / 15)),
                failed_rules=config['violations'],
                review_rules=max(0, 9 - max(1, int(config['score'] / 15)) - config['violations']),
                notes=f"Sample inspection {idx + 1}",
                created_at=datetime.utcnow() - timedelta(days=max(0, 7 - idx))
            )
            db.add(inspection)
        
        # Create compliance rules
        default_rules = get_default_rules()
        for rule_data in default_rules:
            rule = ComplianceRule(
                rule_id=rule_data['rule_id'],
                name=rule_data['name'],
                description=rule_data['description'],
                field=rule_data['field'],
                mandatory=rule_data['mandatory'],
                validation_type=rule_data['validation_type'],
                validation_pattern=rule_data.get('validation_pattern'),
                severity=rule_data['severity'],
                points=rule_data['points'],
                categories=rule_data.get('categories', []),
                version=rule_data['version'],
                enabled=rule_data.get('enabled', True)
            )
            db.add(rule)
        
        db.commit()
        logger.info("Database seeded successfully with initial data")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {str(e)}")
        raise
    
    finally:
        db.close()
