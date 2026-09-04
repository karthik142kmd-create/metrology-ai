"""
Report generation service
Creates professional PDF compliance reports
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image as RLImage, Preformatted
)
from reportlab.pdfgen import canvas
from datetime import datetime
from config import settings
import os
import logging

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generates professional PDF compliance reports"""
    
    def __init__(self):
        self.page_size = letter
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
    
    def _create_custom_styles(self):
        """Create custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='Title',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a3a5c'),
            spaceAfter=12,
            alignment=1
        ))
        
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d5a8c'),
            spaceAfter=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHead',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.white,
            backColor=colors.HexColor('#1a3a5c'),
            spaceAfter=6,
            leftIndent=5,
            rightIndent=5,
            topPadding=5,
            bottomPadding=5
        ))
    
    def generate_report(self, inspection, include_images=True, include_evidence=True, db=None):
        """
        Generate PDF report for inspection
        """
        filename = f"inspection_{inspection.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(settings.report_dir, filename)
        
        # Create PDF
        doc = SimpleDocTemplate(
            filepath,
            pagesize=self.page_size,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        
        story = []
        
        # Header
        story.append(Paragraph("MetrologyAI", self.styles['Title']))
        story.append(Paragraph(
            "AI-Assisted Packaged Commodity Compliance Inspection",
            self.styles['Subtitle']
        ))
        story.append(Spacer(1, 0.3*inch))
        
        # Inspection Info
        story.append(Paragraph("INSPECTION DETAILS", self.styles['SectionHead']))
        
        inspection_details = [
            ['Inspection ID:', inspection.inspection_code],
            ['Product:', inspection.product.product_name if inspection.product else 'N/A'],
            ['Category:', inspection.product.category if inspection.product else 'N/A'],
            ['Inspector:', inspection.inspector.full_name if inspection.inspector else 'N/A'],
            ['Date:', inspection.created_at.strftime('%Y-%m-%d %H:%M:%S')],
            ['Status:', inspection.status.value]
        ]
        
        table = Table(inspection_details, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f0f7')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.2*inch))
        
        # Compliance Score
        story.append(Paragraph("COMPLIANCE ASSESSMENT", self.styles['SectionHead']))
        
        score_color = colors.HexColor('#27ae60') if inspection.compliance_result == 'PASS' else \
                      colors.HexColor('#e74c3c') if inspection.compliance_result == 'FAIL' else \
                      colors.HexColor('#f39c12')
        
        story.append(Paragraph(
            f"<b>Compliance Score: {inspection.compliance_score}%</b><br/>"
            f"<b>Status: <font color='{score_color.hexValue()}'>{inspection.compliance_result}</font></b><br/>"
            f"Rules Passed: {inspection.passed_rules}/{inspection.total_rules}<br/>"
            f"Failed: {inspection.failed_rules} | Review: {inspection.review_rules}",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.2*inch))
        
        # Declarations
        story.append(Paragraph("EXTRACTED DECLARATIONS", self.styles['SectionHead']))
        
        if inspection.extracted_data:
            declaration_data = [['Field', 'Detected Value', 'Confidence']]
            for field, value in inspection.extracted_data.items():
                if isinstance(value, dict):
                    declaration_data.append([
                        field,
                        value.get('value', 'N/A'),
                        f"{value.get('confidence', 0)*100:.0f}%"
                    ])
            
            if len(declaration_data) > 1:
                table = Table(declaration_data, colWidths=[1.5*inch, 3*inch, 1.5*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3a5c')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]))
                story.append(table)
        
        story.append(Spacer(1, 0.2*inch))
        
        # Violations
        if inspection.violations:
            story.append(Paragraph("POTENTIAL VIOLATIONS", self.styles['SectionHead']))
            
            for violation in inspection.violations:
                severity_color = '#e74c3c' if violation.severity == 'HIGH' else \
                                '#f39c12' if violation.severity == 'MEDIUM' else '#3498db'
                
                story.append(Paragraph(
                    f"<b>{violation.violation_type}</b> "
                    f"<font color='{severity_color}'>({violation.severity})</font><br/>"
                    f"{violation.description}<br/>"
                    f"<font size='8'>Confidence: {violation.confidence*100:.0f}%</font>",
                    self.styles['Normal']
                ))
                story.append(Spacer(1, 0.1*inch))
        
        story.append(Spacer(1, 0.2*inch))
        
        # Officer Remarks
        if inspection.officer_remarks:
            story.append(Paragraph("OFFICER REMARKS", self.styles['SectionHead']))
            story.append(Paragraph(inspection.officer_remarks, self.styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph(
            "<b>DISCLAIMER</b><br/>"
            "<font size='8'>This report represents an AI-assisted preliminary screening. "
            "Final legal determination rests with the authorized Legal Metrology authority. "
            "The automated compliance assessment is indicative only and requires officer verification.</font>",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        logger.info(f"Report generated: {filepath}")
        
        return filepath
