"""
Declaration Extraction Service
Extracts structured declarations from OCR text using regex and keyword matching
"""

import re
from typing import Dict, List, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class DeclarationExtractor:
    """Extracts structured declarations from OCR text"""
    
    # Regex patterns
    MRP_PATTERN = r'(?:MRP|M\.R\.P\.|Maximum Retail Price|Price|Max Price)\s*[:=]?\s*(?:Rs\.?|INR|₹)?\s*(\d+(?:[.,]\d{1,2})?)(?:\s*(?:incl\.?\s*of\s*all\s*taxes|incl\s*taxes))?'
    QUANTITY_PATTERN = r'(\d+(?:[.,]\d+)?)\s*(?:kg|g|gm|gms|grams|kilograms|ml|m\.l\.|l|ltr|liter|litre|litres|pieces|units|pcs|pc|number|u|n)\b'
    DATE_PATTERN = r'(?:MFG|PKD|Mfd|Mfg Date|Pkd Date|Manufactured|Packed|Packing Date|Manufacturing Date|Best Before|Use By|EXP|Expiry)\s*[:=]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{2}[/-]\d{4}|[A-Za-z]{3,4}\.?\s*\d{2,4}|\d{2}\s+[A-Za-z]{3,4}\s+\d{2,4})'
    PHONE_PATTERN = r'(?:\+91|0)?\s*(?:1800[- ]?\d{3}[- ]?\d{4}|\d{3,5}[- ]?\d{6,8}|\d{10})'
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    COUNTRY_PATTERN = r'(?:Country of Origin|Made in|Manufactured in|Product of)\s*[:=]?\s*([A-Za-z\s]+?)(?:\.|\n|$|,)'
    FSSAI_PATTERN = r'(?:fssai|lic(?:\.|ense)?\s*no\.?)\s*[:=]?\s*(\d{14})'
    BATCH_PATTERN = r'(?:Batch(?:\s*No\.?)?|Lot(?:\s*No\.?)?|B\.No\.?)\s*[:=]?\s*([A-Za-z0-9\-_/]+)'
    
    # Keywords
    MANUFACTURER_KEYWORDS = ['manufacturer', 'manufactured by', 'mfg by', 'mfd by', 'made by', 'mfr', 'mfgd by', 'packer', 'packed by', 'marketed by', 'mktd by', 'importer', 'imported by']
    ADDRESS_KEYWORDS = ['address', 'location', 'city', 'state', 'country', 'pin', 'postal', 'road', 'street', 'dist', 'taluk', 'plot']
    PRODUCT_NAME_KEYWORDS = ['product', 'brand', 'item', 'commodity', 'name']
    CONSUMER_CARE_KEYWORDS = ['care', 'customer', 'helpline', 'contact', 'service', 'support', 'phone', 'call', 'toll free', 'feedback']
    
    @classmethod
    def extract_all(cls, ocr_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract all declarations from OCR result
        """
        text_blocks = ocr_result.get('text_blocks', [])
        full_text = ocr_result.get('full_text', '')
        
        declarations = {
            'product_name': cls._extract_product_name(text_blocks, full_text),
            'manufacturer': cls._extract_manufacturer(text_blocks, full_text),
            'address': cls._extract_address(text_blocks, full_text),
            'net_quantity': cls._extract_net_quantity(text_blocks, full_text),
            'mrp': cls._extract_mrp(text_blocks, full_text),
            'date': cls._extract_date(text_blocks, full_text),
            'consumer_care': cls._extract_consumer_care(text_blocks, full_text),
            'country_of_origin': cls._extract_country_of_origin(text_blocks, full_text),
        }
        
        return declarations
    
    @classmethod
    def _extract_product_name(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract product name"""
        # Usually first 1-3 words
        words = full_text.split()[:5]
        product_name = ' '.join(words) if words else None
        
        if product_name:
            confidence = 0.92  # Good confidence for product name
            bounding_box = text_blocks[0] if text_blocks else None
            return {
                'value': product_name,
                'confidence': confidence,
                'bounding_box': bounding_box
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_manufacturer(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract manufacturer/packer/importer details"""
        text_lower = full_text.lower()
        
        # Look for keywords
        for keyword in cls.MANUFACTURER_KEYWORDS:
            pattern = rf'{keyword}\s+([A-Za-z\s&,]+?)(?:\n|(?=\d)|(?:Limited|Ltd|Pvt|Inc))'
            match = re.search(pattern, text_lower, re.IGNORECASE)
            if match:
                manufacturer = match.group(1).strip()
                if len(manufacturer) > 2:
                    # Find bounding box
                    bb = cls._find_bounding_box(text_blocks, manufacturer)
                    return {
                        'value': manufacturer,
                        'confidence': 0.87,
                        'bounding_box': bb
                    }
        
        # Look for company name patterns
        company_pattern = r'([A-Za-z\s]+?)(?:Ltd|Limited|Pvt|Inc|Corp|Corporation)\.?'
        matches = re.findall(company_pattern, full_text)
        if matches:
            company = matches[0].strip() + ' Ltd'
            bb = cls._find_bounding_box(text_blocks, company)
            return {
                'value': company,
                'confidence': 0.72,
                'bounding_box': bb
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_address(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract address"""
        # Look for cities, states
        city_state_pattern = r'([A-Za-z]+),?\s+([A-Za-z]+),?\s+([A-Za-z]{2})?'
        match = re.search(city_state_pattern, full_text)
        
        if match:
            address = f"{match.group(1)}, {match.group(2)}"
            if match.group(3):
                address += f", {match.group(3)}"
            bb = cls._find_bounding_box(text_blocks, address)
            return {
                'value': address,
                'confidence': 0.81,
                'bounding_box': bb
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_net_quantity(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract net quantity"""
        match = re.search(cls.QUANTITY_PATTERN, full_text, re.IGNORECASE)
        
        if match:
            quantity = match.group(0)
            bb = cls._find_bounding_box(text_blocks, quantity)
            return {
                'value': quantity,
                'confidence': 0.96,
                'bounding_box': bb
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_mrp(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract MRP"""
        match = re.search(cls.MRP_PATTERN, full_text, re.IGNORECASE)
        
        if match:
            mrp = match.group(0)
            bb = cls._find_bounding_box(text_blocks, mrp)
            return {
                'value': mrp,
                'confidence': 0.98,
                'bounding_box': bb
            }
        
        # Try to find currency + number
        currency_pattern = r'[₹Rs.]+\s*(\d+)'
        match = re.search(currency_pattern, full_text)
        if match:
            mrp = match.group(0)
            bb = cls._find_bounding_box(text_blocks, mrp)
            return {
                'value': mrp,
                'confidence': 0.95,
                'bounding_box': bb
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_date(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract manufacturing/packing date"""
        match = re.search(cls.DATE_PATTERN, full_text, re.IGNORECASE)
        
        if match:
            date = match.group(1)
            bb = cls._find_bounding_box(text_blocks, date)
            return {
                'value': date,
                'confidence': 0.87,
                'bounding_box': bb
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_consumer_care(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract consumer care information"""
        # Look for phone
        phone_match = re.search(cls.PHONE_PATTERN, full_text)
        if phone_match:
            phone = phone_match.group(0)
            bb = cls._find_bounding_box(text_blocks, phone)
            return {
                'value': phone,
                'confidence': 0.91,
                'bounding_box': bb
            }
        
        # Look for email
        email_match = re.search(cls.EMAIL_PATTERN, full_text)
        if email_match:
            email = email_match.group(0)
            bb = cls._find_bounding_box(text_blocks, email)
            return {
                'value': email,
                'confidence': 0.93,
                'bounding_box': bb
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _extract_country_of_origin(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract country of origin"""
        match = re.search(cls.COUNTRY_PATTERN, full_text, re.IGNORECASE)
        
        if match:
            country = match.group(1).strip()
            bb = cls._find_bounding_box(text_blocks, country)
            return {
                'value': country,
                'confidence': 0.85,
                'bounding_box': bb
            }
        
        # Default to India if not found (common for Indian products)
        if 'india' in full_text.lower():
            return {
                'value': 'India',
                'confidence': 0.78,
                'bounding_box': None
            }
        
        return {'value': None, 'confidence': 0.0, 'bounding_box': None}
    
    @classmethod
    def _find_bounding_box(cls, text_blocks: List[Dict], search_text: str) -> Optional[Dict]:
        """Find bounding box for text in blocks with safe coordinate access"""
        if not text_blocks:
            return None
        
        search_lower = search_text.lower()
        
        for block in text_blocks:
            if search_lower in block.get('text', '').lower():
                return {
                    'x': block.get('x', 0),
                    'y': block.get('y', 0),
                    'width': block.get('width', 0),
                    'height': block.get('height', 0)
                }
        
        return None
