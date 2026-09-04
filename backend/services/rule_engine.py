"""
Compliance Rule Engine
Validates declarations against configurable rules
"""

from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from models import ComplianceRule, RuleStatus
import logging

logger = logging.getLogger(__name__)


class RuleValidator:
    """Validates declarations against compliance rules"""
    
    @staticmethod
    def validate_declaration(
        field_name: str,
        extracted_value: Optional[str],
        confidence: float,
        rule: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate a single declaration against a rule
        
        Returns:
            {
                'rule_id': str,
                'status': 'PASS' | 'FAIL' | 'REVIEW',
                'confidence': float,
                'message': str,
                'evidence': str or None,
                'detected_value': str or None
            }
        """
        
        rule_id = rule.get('rule_id')
        validation_type = rule.get('validation_type', 'exists')
        mandatory = rule.get('mandatory', True)
        
        # Check if value exists
        if extracted_value is None or extracted_value == '':
            if mandatory:
                return {
                    'rule_id': rule_id,
                    'status': RuleStatus.FAIL,
                    'confidence': 0.99,
                    'message': f'{field_name} declaration was not detected',
                    'evidence': None,
                    'detected_value': None,
                    'expected_value': f'{field_name} should be present'
                }
            else:
                return {
                    'rule_id': rule_id,
                    'status': RuleStatus.PASS,
                    'confidence': 0.95,
                    'message': f'{field_name} is optional and not detected',
                    'evidence': None,
                    'detected_value': None
                }
        
        # Check OCR confidence
        if confidence < 0.65:
            return {
                'rule_id': rule_id,
                'status': RuleStatus.REVIEW,
                'confidence': confidence,
                'message': f'{field_name} detected but OCR confidence is low',
                'evidence': f'Detected: {extracted_value}',
                'detected_value': extracted_value,
                'expected_value': f'High confidence {field_name}'
            }
        
        # Validate based on type
        if validation_type == 'exists':
            return {
                'rule_id': rule_id,
                'status': RuleStatus.PASS,
                'confidence': confidence,
                'message': f'{field_name} declaration detected',
                'evidence': f'Value: {extracted_value}',
                'detected_value': extracted_value,
                'expected_value': f'{field_name} should be present'
            }
        
        elif validation_type == 'pattern':
            pattern = rule.get('validation_pattern', '')
            import re
            if re.search(pattern, extracted_value, re.IGNORECASE):
                return {
                    'rule_id': rule_id,
                    'status': RuleStatus.PASS,
                    'confidence': confidence,
                    'message': f'{field_name} matches expected format',
                    'evidence': f'Value: {extracted_value}',
                    'detected_value': extracted_value,
                    'expected_value': f'Should match pattern: {pattern}'
                }
            else:
                return {
                    'rule_id': rule_id,
                    'status': RuleStatus.FAIL,
                    'confidence': confidence,
                    'message': f'{field_name} does not match expected format',
                    'evidence': f'Value: {extracted_value}',
                    'detected_value': extracted_value,
                    'expected_value': f'Should match pattern: {pattern}'
                }
        
        return {
            'rule_id': rule_id,
            'status': RuleStatus.PASS,
            'confidence': confidence,
            'message': f'{field_name} validation passed',
            'evidence': f'Value: {extracted_value}',
            'detected_value': extracted_value
        }


class ComplianceScorer:
    """Calculates compliance score from rule results"""
    
    @staticmethod
    def calculate_score(rule_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate compliance score from rule results
        
        Returns:
            {
                'compliance_score': float (0-100),
                'compliance_result': 'PASS' | 'FAIL' | 'REVIEW',
                'total_rules': int,
                'passed_rules': int,
                'failed_rules': int,
                'review_rules': int
            }
        """
        
        if not rule_results:
            return {
                'compliance_score': 0.0,
                'compliance_result': 'REVIEW',
                'total_rules': 0,
                'passed_rules': 0,
                'failed_rules': 0,
                'review_rules': 0
            }
        
        total = len(rule_results)
        passed = sum(1 for r in rule_results if r['status'] == RuleStatus.PASS)
        failed = sum(1 for r in rule_results if r['status'] == RuleStatus.FAIL)
        review = sum(1 for r in rule_results if r['status'] == RuleStatus.REVIEW)
        
        # Calculate score (0-100)
        # All pass = 100
        # Some review = 70-85
        # Some fail = 30-70
        if failed > 0:
            compliance_score = max(30, (passed / total) * 100)
            compliance_result = 'FAIL'
        elif review > 0:
            compliance_score = min(85, (passed / total) * 100 + (review / total) * 40)
            compliance_result = 'REVIEW'
        else:
            compliance_score = 100.0
            compliance_result = 'PASS'
        
        return {
            'compliance_score': round(compliance_score, 1),
            'compliance_result': compliance_result,
            'total_rules': total,
            'passed_rules': passed,
            'failed_rules': failed,
            'review_rules': review
        }


def get_default_rules() -> List[Dict[str, Any]]:
    """
    Get default compliance rules for MVP
    """
    return [
        {
            'rule_id': 'LM-MRP-001',
            'name': 'MRP Declaration',
            'description': 'Maximum Retail Price should be clearly declared',
            'field': 'mrp',
            'mandatory': True,
            'validation_type': 'exists',
            'severity': 'HIGH',
            'points': 20,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-NQ-001',
            'name': 'Net Quantity Declaration',
            'description': 'Net quantity/weight/volume should be declared in metric units',
            'field': 'net_quantity',
            'mandatory': True,
            'validation_type': 'pattern',
            'validation_pattern': r'\d+\s*(?:kg|g|ml|l|pieces)',
            'severity': 'HIGH',
            'points': 20,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-MFG-001',
            'name': 'Manufacturer/Packer Details',
            'description': 'Name and address of manufacturer/packer/importer should be declared',
            'field': 'manufacturer',
            'mandatory': True,
            'validation_type': 'exists',
            'severity': 'HIGH',
            'points': 20,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-ADDR-001',
            'name': 'Address Declaration',
            'description': 'Complete address including city/town and state should be declared',
            'field': 'address',
            'mandatory': True,
            'validation_type': 'exists',
            'severity': 'HIGH',
            'points': 15,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-DATE-001',
            'name': 'Date Declaration',
            'description': 'Manufacturing/Packing/Expiry date should be declared where applicable',
            'field': 'date',
            'mandatory': True,
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 15,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-CARE-001',
            'name': 'Consumer Care Information',
            'description': 'Phone number or email for consumer care should be declared',
            'field': 'consumer_care',
            'mandatory': True,
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 10,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-COO-001',
            'name': 'Country of Origin',
            'description': 'Country of origin should be declared where applicable',
            'field': 'country_of_origin',
            'mandatory': False,
            'validation_type': 'exists',
            'severity': 'LOW',
            'points': 5,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-PROD-001',
            'name': 'Product Name Declaration',
            'description': 'Name/description of the product should be clearly declared',
            'field': 'product_name',
            'mandatory': True,
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 10,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-OCR-001',
            'name': 'Text Readability',
            'description': 'Declarations should have minimum OCR confidence for readability',
            'field': 'ocr_confidence',
            'mandatory': True,
            'validation_type': 'pattern',
            'validation_pattern': r'0\.[789]\d|1\.0',
            'severity': 'LOW',
            'points': 5,
            'categories': ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic'],
            'version': '2011',
            'enabled': False
        }
    ]
