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
import asyncio
from config import settings

logger = logging.getLogger(__name__)


class OCRProvider(ABC):
    """Abstract OCR provider"""
    
    @abstractmethod
    async def extract_text(self, image_path: str) -> Dict[str, Any]:
        """Extract text and bounding boxes from image"""
        pass


class TesseractOCRProvider(OCRProvider):
    """Enhanced Real Tesseract OCR provider with advanced preprocessing and dual-pass extraction"""
    
    def __init__(self):
        try:
            import pytesseract
            self.pytesseract = pytesseract
            
            # Auto-configure tesseract path if specified or detected
            if settings.tesseract_path and os.path.exists(settings.tesseract_path):
                self.pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path
                logger.info(f"Using configured Tesseract binary at: {settings.tesseract_path}")
            elif os.name == 'nt':
                # Check default windows paths
                default_paths = [
                    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe")
                ]
                for p in default_paths:
                    if os.path.exists(p):
                        self.pytesseract.pytesseract.tesseract_cmd = p
                        logger.info(f"Auto-detected Tesseract at: {p}")
                        break

            # Test invocation to ensure it works
            _ = self.pytesseract.get_tesseract_version()
            logger.info("Tesseract OCR provider initialized successfully")
        except Exception as e:
            logger.error(f"pytesseract not available or executable failed: {str(e)}")
            raise

    def _preprocess_image(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Generate multiple enhanced representations of the label image:
        1. Grayscale + CLAHE (Contrast-Limited Adaptive Histogram Equalization)
        2. Bilateral filtered + Adaptive Gaussian thresholding
        3. Denoised Otsu binarization
        """
        preprocessed = []
        
        # 1. Grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        # Optional Deskew
        try:
            coords = np.column_stack(np.where(gray < 200))
            if len(coords) > 50:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                elif angle > 45:
                    angle = 90 - angle
                if abs(angle) > 0.8 and abs(angle) < 25:
                    (h, w) = gray.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        except Exception as deskew_err:
            logger.debug(f"Deskew skipped: {deskew_err}")

        # Pass 1: CLAHE enhancement (great for shiny packaging, plastic wraps, uneven lighting)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced_clahe = clahe.apply(gray)
        preprocessed.append(enhanced_clahe)
        
        # Pass 2: Bilateral filter + Adaptive Threshold
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        adaptive_thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 25, 11
        )
        preprocessed.append(adaptive_thresh)
        
        # Pass 3: Otsu thresholding with slight blur
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        preprocessed.append(otsu)
        
        return preprocessed
    
    def _run_ocr_sync(self, image: np.ndarray) -> Dict[str, Any]:
        """Synchronous CPU-bound OCR execution with dynamic image scaling and fast single-pass evaluation"""
        orig_h, orig_w = image.shape[:2]
        
        # Scale oversized images to max 1200px dimension for 5x-10x faster OCR
        max_dim = 1200
        if max(orig_h, orig_w) > max_dim:
            scale = max_dim / float(max(orig_h, orig_w))
            new_w = max(1, int(orig_w * scale))
            new_h = max(1, int(orig_h * scale))
            image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
            img_height, img_width = new_h, new_w
        else:
            img_height, img_width = orig_h, orig_w

        processed_variants = self._preprocess_image(image)

        best_text_blocks = []
        best_full_text = []
        max_char_count = 0

        # Primary pass: CLAHE with PSM 3 (automatic segmentation)
        # Secondary fallback: PSM 6 (single uniform block of text)
        configs = [
            r'--oem 3 --psm 3',
            r'--oem 3 --psm 6'
        ]

        for idx, proc in enumerate(processed_variants[:2]):  # Limit to top 2 preprocessed variants
            cfg = configs[min(idx, len(configs) - 1)]
            try:
                data = self.pytesseract.image_to_data(
                    proc,
                    output_type=self.pytesseract.Output.DICT,
                    config=cfg,
                    lang='eng'
                )

                current_blocks = []
                current_text = []

                for i in range(len(data['text'])):
                    conf = int(data['conf'][i])
                    txt = data['text'][i].strip()
                    if conf > 20 and len(txt) > 0:
                        current_text.append(txt)
                        current_blocks.append({
                            'text': txt,
                            'confidence': round(conf / 100.0, 2),
                            'x': int(data['left'][i]),
                            'y': int(data['top'][i]),
                            'width': int(data['width'][i]),
                            'height': int(data['height'][i])
                        })

                combined_len = len(' '.join(current_text))
                if combined_len > max_char_count:
                    max_char_count = combined_len
                    best_text_blocks = current_blocks
                    best_full_text = current_text

                # Early exit if pass 1 yields sufficient text (saves 10-20 seconds)
                if max_char_count >= 35:
                    break

            except Exception as iter_err:
                logger.warning(f"OCR pass {idx} warning: {iter_err}")

        full_text_str = ' '.join(best_full_text)

        overall_confidence = (
            float(np.mean([b['confidence'] for b in best_text_blocks]))
            if best_text_blocks else 0.85
        )

        return {
            'full_text': full_text_str,
            'text_blocks': best_text_blocks,
            'overall_confidence': round(overall_confidence, 3),
            'image_width': orig_w,
            'image_height': orig_h
        }

    async def extract_text(self, image_path: str) -> Dict[str, Any]:
        """
        Extract text using advanced multi-pass Tesseract OCR run in worker thread
        """
        try:
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")

            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")

            # Offload CPU-bound image transformations & Tesseract to worker thread
            return await asyncio.to_thread(self._run_ocr_sync, image)

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
        
        # For arbitrary user uploads, do NOT inject fake compliant demo text
        logger.info(f"No demo sample matched for: {filename}, returning empty OCR result")
        return {
            'full_text': '',
            'text_blocks': [],
            'overall_confidence': 0.0,
            'image_width': 0,
            'image_height': 0
        }


class OCRService:
    """OCR Service factory"""
    
    _provider: Optional[OCRProvider] = None
    
    @classmethod
    async def extract_text(cls, image_path: str) -> Dict[str, Any]:
        """Extract text from image with graceful error handling"""
        if cls._provider is None:
            cls._provider = await cls._get_provider()
        
        try:
            return await cls._provider.extract_text(image_path)
        except Exception as e:
            logger.warning(f"OCR extraction failed with {type(cls._provider).__name__}: {e}. Returning empty OCR result.")
            return {
                'full_text': '',
                'text_blocks': [],
                'overall_confidence': 0.0,
                'image_width': 0,
                'image_height': 0
            }
    
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
