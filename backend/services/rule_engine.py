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
    """Calculates compliance score and percentage rate from rule results"""
    
    @staticmethod
    def calculate_score(rule_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate compliance score and compliance rate from rule results
        
        Returns:
            {
                'compliance_score': float (0-100),
                'compliance_rate': float (0-100),
                'compliance_result': 'PASS' | 'FAIL' | 'REVIEW',
                'total_rules': int,
                'passed_rules': int,
                'failed_rules': int,
                'review_rules': int,
                'earned_points': int,
                'total_points': int
            }
        """
        
        if not rule_results:
            return {
                'compliance_score': 0.0,
                'compliance_rate': 0.0,
                'compliance_result': 'REVIEW',
                'total_rules': 0,
                'passed_rules': 0,
                'failed_rules': 0,
                'review_rules': 0,
                'earned_points': 0,
                'total_points': 0
            }
        
        total = len(rule_results)
        passed = sum(1 for r in rule_results if r['status'] == RuleStatus.PASS)
        failed = sum(1 for r in rule_results if r['status'] == RuleStatus.FAIL)
        review = sum(1 for r in rule_results if r['status'] == RuleStatus.REVIEW)
        
        total_points = sum(r.get('points', 10) for r in rule_results)
        earned_points = sum(
            r.get('points', 10) if r['status'] == RuleStatus.PASS
            else (r.get('points', 10) * 0.5 if r['status'] == RuleStatus.REVIEW else 0)
            for r in rule_results
        )
        
        compliance_rate = round((earned_points / total_points * 100) if total_points > 0 else 0, 1)
        
        # Result determination
        if failed > 0:
            compliance_result = 'FAIL'
        elif review > 0:
            compliance_result = 'REVIEW'
        else:
            compliance_result = 'PASS'
        
        return {
            'compliance_score': compliance_rate,
            'compliance_rate': compliance_rate,
            'compliance_result': compliance_result,
            'total_rules': total,
            'passed_rules': passed,
            'failed_rules': failed,
            'review_rules': review,
            'earned_points': round(earned_points, 1),
            'total_points': total_points
        }


def get_default_rules() -> List[Dict[str, Any]]:
    """
    Get default compliance rules under Legal Metrology (Packaged Commodities) Rules 2011
    """
    all_categories = ['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic', 'General', 'Pharmaceutical', 'Other']
    
    return [
        {
            'rule_id': 'LM-MRP-001',
            'name': 'Maximum Retail Price (MRP)',
            'description': 'Maximum Retail Price inclusive of all taxes must be clearly declared with currency symbol (₹ / Rs.)',
            'field': 'mrp',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(e), LM(PC) Rules 2011',
            'penalty_info': 'Penalty up to ₹25,000 under Section 36(1) of Legal Metrology Act 2009',
            'validation_type': 'exists',
            'severity': 'HIGH',
            'points': 20,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-NQ-001',
            'name': 'Net Quantity Declaration',
            'description': 'Net weight/volume/units must be declared in standard SI metric units (g, kg, ml, l, pcs)',
            'field': 'net_quantity',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(c) & Second Schedule, LM(PC) Rules 2011',
            'penalty_info': 'Penalty up to ₹20,000 under Section 30 of Legal Metrology Act 2009',
            'validation_type': 'pattern',
            'validation_pattern': r'\d+(?:[.,]\d+)?\s*(?:kg|g|gm|gms|ml|l|ltr|liter|litre|litres|pcs|pieces|units|pc|u|n)\b',
            'severity': 'HIGH',
            'points': 20,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-MFG-001',
            'name': 'Manufacturer / Packer / Importer Name',
            'description': 'Name of manufacturer, packer, or importer must be prominently printed on the label',
            'field': 'manufacturer',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(a), LM(PC) Rules 2011',
            'penalty_info': 'Fine up to ₹25,000 for misdeclaration under Section 36',
            'validation_type': 'exists',
            'severity': 'HIGH',
            'points': 15,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-ADDR-001',
            'name': 'Complete Postal Address',
            'description': 'Complete address including city, state, or PIN code where entity can be contacted',
            'field': 'address',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(a), LM(PC) Rules 2011',
            'penalty_info': 'Procedural violation fine up to ₹10,000 under LM Rules',
            'validation_type': 'exists',
            'severity': 'HIGH',
            'points': 15,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-DATE-001',
            'name': 'Date of Manufacture / Packing',
            'description': 'Month and year of manufacture or packaging must be declared (e.g., 08/2026 or Aug 2026)',
            'field': 'date',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(d), LM(PC) Rules 2011',
            'penalty_info': 'Packaging violation fine up to ₹25,000; sale prohibited after expiry',
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 10,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-CARE-001',
            'name': 'Consumer Care / Helpline',
            'description': 'Toll-free telephone number or email address for consumer complaints must be declared',
            'field': 'consumer_care',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(f), LM(PC) Rules 2011',
            'penalty_info': 'Fine up to ₹25,000 under Rule 32 of LM(PC) Rules',
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 10,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-COO-001',
            'name': 'Country of Origin',
            'description': 'Country of origin must be declared on all pre-packaged commodities (e.g., Made in India)',
            'field': 'country_of_origin',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(a) Amendment 2017/2020',
            'penalty_info': 'Non-declaration violation; fine up to ₹50,000 and customs hold',
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 5,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        },
        {
            'rule_id': 'LM-PROD-001',
            'name': 'Common / Generic Commodity Name',
            'description': 'Generic name or description of the commodity contained in the package',
            'field': 'product_name',
            'mandatory': True,
            'legal_reference': 'Rule 6(1)(b), LM(PC) Rules 2011',
            'penalty_info': 'Fine up to ₹15,000 for non-disclosure of commodity generic name',
            'validation_type': 'exists',
            'severity': 'MEDIUM',
            'points': 5,
            'categories': all_categories,
            'version': '2011',
            'enabled': True
        }
    ]
