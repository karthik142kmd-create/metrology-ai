"""
OCR Service abstraction
Supports both real OCR (Tesseract) and demo fallback
"""

from abc import ABC, abstractmethod
import cv2
import numpy as np
from PIL import Image
from typing import Dict, List, Any, Optional
import logging
import os
from config import settings

logger = logging.getLogger(__name__)


class OCRProvider(ABC):
    """Abstract OCR provider"""
    
    @abstractmethod
    async def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text and bounding boxes from image"""
        pass


class TesseractOCRProvider(OCRProvider):
    """Real Tesseract OCR provider"""
    
    def __init__(self):
        try:
            import pytesseract
            self.pytesseract = pytesseract
            logger.info("Tesseract OCR provider initialized")
        except ImportError:
            logger.error("pytesseract not available")
            raise
    
    async def extract_text(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text using Tesseract OCR
        """
        try:
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")
            
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Preprocess
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            processed = cv2.bilateralFilter(gray, 9, 75, 75)
            
            # OCR with data
            data = self.pytesseract.image_to_data(
                processed,
                output_type=self.pytesseract.Output.DICT,
                lang='eng'
            )
            
            # Extract text and bounding boxes
            text_blocks = []
            full_text = []
            
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 0:  # confidence > 0
                    text = data['text'][i].strip()
                    if text:
                        full_text.append(text)
                        text_blocks.append({
                            'text': text,
                            'confidence': int(data['conf'][i]) / 100.0,
                            'x': int(data['left'][i]),
                            'y': int(data['top'][i]),
                            'width': int(data['width'][i]),
                            'height': int(data['height'][i])
                        })
            
            overall_confidence = np.mean([b['confidence'] for b in text_blocks]) if text_blocks else 0
            
            return {
                'full_text': ' '.join(full_text),
                'text_blocks': text_blocks,
                'overall_confidence': overall_confidence,
                'image_width': image.shape[1],
                'image_height': image.shape[0]
            }
        
        except Exception as e:
            logger.error(f"Tesseract OCR error: {str(e)}")
            raise


class DemoOCRProvider(OCRProvider):
    """Demo OCR provider with sample data"""
    
    SAMPLE_DATA = {
        'abc_rice.jpg': {
            'full_text': 'ABC Premium Rice 5kg MFG 08/2026 PKD 08/2026 ABC Foods Pvt Ltd Hyderabad Telangana India MRP ₹650 Customer Care 1800-123-4567',
            'text_blocks': [
                {'text': 'ABC', 'confidence': 0.98, 'x': 50, 'y': 30, 'width': 80, 'height': 40},
                {'text': 'Premium', 'confidence': 0.97, 'x': 140, 'y': 30, 'width': 100, 'height': 40},
                {'text': 'Rice', 'confidence': 0.96, 'x': 250, 'y': 30, 'width': 70, 'height': 40},
                {'text': '5kg', 'confidence': 0.99, 'x': 50, 'y': 100, 'width': 60, 'height': 35},
                {'text': 'MFG', 'confidence': 0.98, 'x': 50, 'y': 160, 'width': 50, 'height': 30},
                {'text': '08/2026', 'confidence': 0.90, 'x': 110, 'y': 160, 'width': 80, 'height': 30},
                {'text': 'ABC', 'confidence': 0.97, 'x': 50, 'y': 220, 'width': 60, 'height': 30},
                {'text': 'Foods', 'confidence': 0.96, 'x': 120, 'y': 220, 'width': 70, 'height': 30},
                {'text': 'Pvt', 'confidence': 0.95, 'x': 200, 'y': 220, 'width': 50, 'height': 30},
                {'text': 'Ltd', 'confidence': 0.98, 'x': 260, 'y': 220, 'width': 40, 'height': 30},
                {'text': 'Hyderabad', 'confidence': 0.94, 'x': 50, 'y': 270, 'width': 90, 'height': 25},
                {'text': 'Telangana', 'confidence': 0.93, 'x': 150, 'y': 270, 'width': 90, 'height': 25},
                {'text': 'India', 'confidence': 0.97, 'x': 250, 'y': 270, 'width': 70, 'height': 25},
                {'text': 'MRP', 'confidence': 0.99, 'x': 50, 'y': 330, 'width': 50, 'height': 30},
                {'text': '₹650', 'confidence': 0.99, 'x': 110, 'y': 330, 'width': 70, 'height': 30},
                {'text': 'Customer', 'confidence': 0.91, 'x': 50, 'y': 390, 'width': 80, 'height': 25},
                {'text': 'Care', 'confidence': 0.92, 'x': 140, 'y': 390, 'width': 60, 'height': 25},
                {'text': '1800-123-4567', 'confidence': 0.88, 'x': 210, 'y': 390, 'width': 120, 'height': 25},
            ],
            'overall_confidence': 0.945,
            'image_width': 400,
            'image_height': 500
        },
        'demo_product.jpg': {
            'full_text': 'Fresh Cooking Oil Pure Vegetable Oil 1L MFG 07/2026 Manufacturer XYZ Oils Ltd Bangalore Manufactured in India MRP ₹180',
            'text_blocks': [
                {'text': 'Fresh', 'confidence': 0.96, 'x': 40, 'y': 25, 'width': 70, 'height': 38},
                {'text': 'Cooking', 'confidence': 0.95, 'x': 120, 'y': 25, 'width': 85, 'height': 38},
                {'text': 'Oil', 'confidence': 0.98, 'x': 215, 'y': 25, 'width': 55, 'height': 38},
                {'text': 'Pure', 'confidence': 0.91, 'x': 40, 'y': 80, 'width': 60, 'height': 32},
                {'text': 'Vegetable', 'confidence': 0.89, 'x': 110, 'y': 80, 'width': 85, 'height': 32},
                {'text': 'Oil', 'confidence': 0.98, 'x': 205, 'y': 80, 'width': 55, 'height': 32},
                {'text': '1L', 'confidence': 0.99, 'x': 40, 'y': 130, 'width': 45, 'height': 30},
                {'text': 'MFG', 'confidence': 0.98, 'x': 40, 'y': 180, 'width': 48, 'height': 28},
                {'text': '07/2026', 'confidence': 0.92, 'x': 100, 'y': 180, 'width': 75, 'height': 28},
                {'text': 'XYZ', 'confidence': 0.94, 'x': 40, 'y': 230, 'width': 55, 'height': 28},
                {'text': 'Oils', 'confidence': 0.95, 'x': 105, 'y': 230, 'width': 48, 'height': 28},
                {'text': 'Ltd', 'confidence': 0.97, 'x': 165, 'y': 230, 'width': 40, 'height': 28},
                {'text': 'Bangalore', 'confidence': 0.93, 'x': 40, 'y': 275, 'width': 85, 'height': 26},
                {'text': 'Made', 'confidence': 0.68, 'x': 40, 'y': 320, 'width': 55, 'height': 26},
                {'text': 'India', 'confidence': 0.97, 'x': 105, 'y': 320, 'width': 65, 'height': 26},
                {'text': 'MRP', 'confidence': 0.99, 'x': 40, 'y': 370, 'width': 48, 'height': 28},
                {'text': '₹180', 'confidence': 0.99, 'x': 100, 'y': 370, 'width': 65, 'height': 28},
            ],
            'overall_confidence': 0.927,
            'image_width': 400,
            'image_height': 450
        }
    }
    
    async def extract_text(self, image_path: str) -> Dict[str, Any]:
        """
        Return demo OCR data
        """
        filename = os.path.basename(image_path).lower()
        
        # Try exact match
        if filename in self.SAMPLE_DATA:
            logger.info(f"Returning demo OCR for: {filename}")
            return self.SAMPLE_DATA[filename]
        
        # Try matching pattern
        for key in self.SAMPLE_DATA:
            if any(pattern in filename for pattern in ['rice', 'demo', 'product', 'abc']):
                logger.info(f"Returning demo OCR for pattern match: {filename}")
                return self.SAMPLE_DATA['abc_rice.jpg']
        
        # Default
        logger.info(f"Using fallback demo OCR for: {filename}")
        return self.SAMPLE_DATA['abc_rice.jpg']


class OCRService:
    """OCR Service factory"""
    
    _provider: Optional[OCRProvider] = None
    
    @classmethod
    async def extract_text(cls, image_path: str) -> Dict[str, Any]:
        """Extract text from image"""
        if cls._provider is None:
            cls._provider = await cls._get_provider()
        
        return await cls._provider.extract_text(image_path)
    
    @classmethod
    async def _get_provider(cls) -> OCRProvider:
        """Get OCR provider based on configuration"""
        provider_name = settings.ocr_provider.lower()
        
        if provider_name == "demo":
            logger.info("Using Demo OCR Provider")
            return DemoOCRProvider()
        
        if provider_name == "tesseract":
            logger.info("Using Tesseract OCR Provider")
            try:
                return TesseractOCRProvider()
            except Exception as e:
                logger.warning(f"Tesseract failed, falling back to demo: {e}")
                return DemoOCRProvider()
        
        # Auto - try tesseract, fallback to demo
        try:
            logger.info("Attempting Tesseract (auto mode)")
            return TesseractOCRProvider()
        except Exception as e:
            logger.warning(f"Tesseract not available ({e}), using Demo OCR Provider")
            return DemoOCRProvider()
