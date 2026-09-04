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
    MRP_PATTERN = r'(?:MRP|M\.R\.P\.|Maximum Retail Price|MAXRETAILPRICE|Price|Max Price)\s*[:=.]*\s*(?:Rs\.?|Ps\.?|INR|₹)?\s*(\d+(?:[.,]\d{1,2})?)(?:\s*(?:incl\.?\s*of\s*all\s*taxes|incl\s*taxes))?'
    QUANTITY_PATTERN = r'(\d+(?:[.,]\d+)?)\s*(?:kg|g|gm|gms|grams|kilograms|ml|m\.l\.|l|ltr|liter|litre|litres|pieces|units|pcs|pc|number|u|n)\b'
    DATE_PATTERN = r'(?:MFG|PKD|Mfd|Mfg Date|Pkd Date|Packing Date|Manufacturing Date|Date\s*of\s*Packing|Best Before|Use By|EXP|Expiry)\s*[:=.]*\s*([A-Za-z0-9./\-_ ]{4,15})'
    PHONE_PATTERN = r'(?:\+91|0)?\s*(?:1800[- ]?\d{3}[- ]?\d{4}|\d{3,5}[- ]?\d{6,8}|\d{10})'
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,}|com|org|in|net)'
    COUNTRY_PATTERN = r'(?:Country\s*of\s*Origin|Made\s*in|Manufactured\s*in|Product\s*of)\s*[:=.]*\s*([A-Za-z\s]+?)(?:\.|\n|$|,)'
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
        
        # Post-process: Invalidate placeholder/missing declarations
        for k, v in declarations.items():
            if v and v.get('value'):
                val_str = str(v['value']).strip()
                if re.search(r'\b(?:not\s*declared|not\s*provided|not\s*available|nil|none|n/?a)\b', val_str, re.IGNORECASE):
                    v['value'] = None
                    v['confidence'] = 0.0
                elif len(val_str) < 2:
                    v['value'] = None
                    v['confidence'] = 0.0
        
        return declarations
    
    @classmethod
    def _extract_product_name(cls, text_blocks: List[Dict], full_text: str) -> Dict[str, Any]:
        """Extract product / commodity name"""
        # Check for explicit Commodity/Product/Brand label (including Commodity / Product Name:)
        prod_match = re.search(r'(?:Commodity(?:\s*[/|]\s*Product(?:\s*Name)?)?|Product(?:\s*Name)?|Brand|Item)\s*[:=.\-]*\s*([A-Za-z0-9\s&\'\-]{3,50})(?:\n|\r|$|,)', full_text, re.IGNORECASE)
        if prod_match and len(prod_match.group(1).strip()) > 2:
            val = prod_match.group(1).strip()
            return {
                'value': val,
                'confidence': 0.95,
                'bounding_box': cls._find_bounding_box(text_blocks, val[:15])
            }
        
        # Fallback: scan lines excluding system/meta headers
        for line in full_text.split('\n'):
            cleaned = line.strip()
            if cleaned and len(cleaned) > 3 and not any(kw in cleaned.upper() for kw in ['LEGAL METROLOGY', 'DECLARATION', 'SAMPLE', 'INSPECTION', 'AUDIT', 'MANDATORY']):
                words = cleaned.split()[:6]
                if words:
                    val = ' '.join(words)
                    return {
                        'value': val,
                        'confidence': 0.88,
                        'bounding_box': cls._find_bounding_box(text_blocks, val[:15])
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
        """Extract complete postal address"""
        # Look for PIN code pattern (6 digits)
        pin_match = re.search(r'(?:PIN|Postal|Pincode|Pin Code)?\s*[:=\-]?\s*([1-9][0-9]{5})\b', full_text, re.IGNORECASE)
        
        # Look for common Indian cities/states/locations
        location_keywords = [
            'mumbai', 'delhi', 'bengaluru', 'bangalore', 'hyderabad', 'chennai', 'kolkata',
            'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore',
            'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana',
            'coimbatore', 'madurai', 'nashik', 'kochi', 'noida', 'gurgaon', 'gurugram', 'chandigarh',
            'telangana', 'maharashtra', 'karnataka', 'tamil nadu', 'gujarat', 'uttar pradesh',
            'rajasthan', 'madhya pradesh', 'west bengal', 'haryana', 'punjab', 'kerala', 'andhra pradesh'
        ]
        
        found_locations = [loc.title() for loc in location_keywords if loc in full_text.lower()]
        
        # Check for address keywords
        addr_match = re.search(r'(?:Address|Factory|Unit|Regd\.?\s*Office|Works|Plant|Plot\s*No\.?)\s*[:=\-]?\s*([^,\n\r]+(?:,[^,\n\r]+){1,3})', full_text, re.IGNORECASE)
        
        if addr_match:
            addr_val = addr_match.group(0).strip()
            bb = cls._find_bounding_box(text_blocks, addr_match.group(1).strip()[:15])
            return {
                'value': addr_val,
                'confidence': 0.89,
                'bounding_box': bb
            }
        
        if found_locations:
            loc_str = ", ".join(found_locations[:3])
            if pin_match:
                loc_str += f" - {pin_match.group(1)}"
            bb = cls._find_bounding_box(text_blocks, found_locations[0])
            return {
                'value': loc_str,
                'confidence': 0.85,
                'bounding_box': bb
            }
        
        if pin_match:
            pin_val = f"PIN: {pin_match.group(1)}"
            bb = cls._find_bounding_box(text_blocks, pin_match.group(1))
            return {
                'value': pin_val,
                'confidence': 0.80,
                'bounding_box': bb
            }
        
        # Fallback to city state pattern
        city_state_pattern = r'([A-Za-z]+),?\s+([A-Za-z]+),?\s+([A-Za-z]{2})?'
        match = re.search(city_state_pattern, full_text)
        if match and len(match.group(1)) > 3:
            address = f"{match.group(1)}, {match.group(2)}"
            if match.group(3):
                address += f", {match.group(3)}"
            bb = cls._find_bounding_box(text_blocks, address)
            return {
                'value': address,
                'confidence': 0.75,
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
        
        # Try to find currency + number (require actual currency symbol or Rs/INR)
        currency_pattern = r'(?:₹|Rs\.?|INR)\s*(\d+(?:[.,]\d{1,2})?)'
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
        # First check explicit MM/YYYY or MM/YY or MM-YYYY patterns
        explicit_date = re.search(r'\b(0?[1-9]|1[0-2])[/-](20\d{2}|\d{2})\b', full_text)
        if explicit_date:
            date_val = explicit_date.group(0)
            bb = cls._find_bounding_box(text_blocks, date_val)
            return {
                'value': date_val,
                'confidence': 0.95,
                'bounding_box': bb
            }

        # Month name + Year: e.g. Aug 2026, August 2026, 08/2026
        month_year = re.search(r'\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?,?\s*(20\d{2}|\d{2})\b', full_text, re.IGNORECASE)
        if month_year:
            date_val = month_year.group(0)
            bb = cls._find_bounding_box(text_blocks, date_val)
            return {
                'value': date_val,
                'confidence': 0.92,
                'bounding_box': bb
            }

        # Match with prefix keywords
        match = re.search(cls.DATE_PATTERN, full_text, re.IGNORECASE)
        if match:
            date = match.group(1).strip()
            bb = cls._find_bounding_box(text_blocks, date)
            return {
                'value': date,
                'confidence': 0.85,
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
        match = re.search(r'(?:Country\s*of\s*Origin|Made\s*in|Manufactured\s*in|Product\s*of)\s*[:=.\-]*\s*(?:Country\s*of\s*Origin\s*[:=.\-]*)?\s*([A-Za-z]+)\b', full_text, re.IGNORECASE)
        
        if match:
            country = match.group(1).strip()
            if len(country) >= 3 and country.lower() not in ['of', 'the', 'origin', 'and']:
                bb = cls._find_bounding_box(text_blocks, country)
                return {
                    'value': country.title(),
                    'confidence': 0.95,
                    'bounding_box': bb
                }
        
        # Check if India or other country is mentioned near packaging declarations
        if 'india' in full_text.lower():
            return {
                'value': 'India',
                'confidence': 0.88,
                'bounding_box': cls._find_bounding_box(text_blocks, 'India')
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
