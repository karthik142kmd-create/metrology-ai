# MetrologyAI

**AI-Assisted Packaged Commodity Compliance Inspector**

A complete full-stack application for automating compliance inspections of packaged commodities under the Legal Metrology Act, 2009 and Related Regulations.

## Project Overview

MetrologyAI is an MVP (Minimum Viable Product) developed for the Smart India Hackathon. It leverages artificial intelligence, computer vision, and rule-based validation to assist Legal Metrology officers in inspecting packaged commodities for compliance with mandatory declarations.

**Key Features:**
- 📸 AI-powered OCR for automatic text extraction from product images
- ✅ Rule-based compliance validation engine
- 📊 Real-time dashboard with analytics
- 📝 Professional PDF report generation
- 🎯 Evidence-based violation detection
- 🔍 Inspection history and product repository
- 👥 Role-based access (Admin/Inspector)

## Architecture

```
MetrologyAI
├── Backend (FastAPI + SQLAlchemy)
│   ├── API Routes
│   ├── OCR Service
│   ├── Extraction Service
│   ├── Rule Engine
│   ├── Report Generation
│   └── Database Models
└── Frontend (React + Vite)
    ├── Authentication
    ├── Dashboard
    ├── Inspection Workflow
    ├── Reports
    └── Management Pages
```

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (production-ready for PostgreSQL)
- **ORM**: SQLAlchemy
- **OCR**: Tesseract (with demo fallback)
- **Reports**: ReportLab
- **Authentication**: JWT tokens with Passlib
- **Python Version**: 3.8+

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Tesseract OCR (optional, demo mode works without it)

### Backend Setup

1. **Clone repository and navigate to backend:**
   ```bash
   cd metrology-ai/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database:**
   ```bash
   python -m main  # Database tables created automatically
   ```

6. **Run backend server:**
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd metrology-ai/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

Frontend will be available at `http://localhost:5173`

## Demo Credentials

### Admin Account
- **Email**: admin@metrology.ai
- **Password**: admin123
- **Access**: Full system access, rule management, user management

### Inspector Account
- **Email**: inspector@metrology.ai
- **Password**: inspector123
- **Access**: Inspection creation, scanning, report generation

## Usage Workflow

### New Inspection Process

1. **Login** → Authenticate with credentials
2. **Select Category** → Choose product category (Food, Beverage, etc.)
3. **Select Product** → Pick from repository or create new
4. **Upload Images** → Drag/drop or select package images
5. **Start Scan** → Automated OCR and analysis
6. **Review Results** → Check detected declarations and violations
7. **Generate Report** → Download professional PDF report
8. **View History** → Track all inspections in history page

### Key Pages

- **Dashboard**: Real-time analytics, compliance trends, recent inspections
- **New Inspection**: Complete workflow for package inspection
- **Inspections**: Search, filter, and manage past inspections
- **Products**: Repository of inspected products
- **Rules**: View and manage compliance rules
- **Settings**: User profile and system settings

## API Documentation

### Authentication
```
POST /api/auth/login
  Body: { email, password }
  Returns: { access_token, user }

GET /api/auth/me
  Returns: Current user info
```

### Inspections
```
POST /api/inspections
  Create new inspection

GET /api/inspections
  List all inspections with filters

GET /api/inspections/{id}
  Get inspection details

POST /api/inspections/{id}/images
  Upload inspection images

POST /api/inspections/{id}/scan
  Run OCR and validation on images
```

### Analysis
```
POST /api/analysis/ocr
  Extract text from image

POST /api/analysis/extract-declarations
  Extract structured fields

POST /api/analysis/validate
  Validate against compliance rules
```

### Reports
```
POST /api/reports/{inspection_id}
  Generate PDF report

GET /api/reports/{inspection_id}/download
  Download generated PDF
```

### Dashboard
```
GET /api/dashboard/stats
  Get dashboard statistics

GET /api/dashboard/violations
  Get violation statistics

GET /api/dashboard/trends
  Get compliance trends over time
```

See `docs/API.md` for complete API documentation.

## Database Schema

### Key Tables
- **users**: System users (Admin/Inspector)
- **products**: Product repository
- **inspections**: Inspection records
- **inspection_images**: Uploaded images
- **extracted_declarations**: OCR results
- **compliance_rules**: Rule definitions
- **rule_results**: Rule validation results
- **violations**: Detected violations
- **compliance_reports**: Generated reports

## Rule Engine

The rule engine validates inspections against configurable rules.

### Rule Structure
```json
{
  "rule_id": "LM-MRP-001",
  "name": "MRP Declaration",
  "field": "mrp",
  "mandatory": true,
  "validation_type": "exists",
  "severity": "HIGH",
  "enabled": true,
  "version": "2011"
}
```

### Rule Results
- **PASS**: Requirement met
- **FAIL**: Requirement not met
- **REVIEW**: Needs manual verification (low OCR confidence)

### Default Rules
1. **LM-MRP-001**: MRP Declaration
2. **LM-NQ-001**: Net Quantity Declaration
3. **LM-MFG-001**: Manufacturer/Packer Details
4. **LM-ADDR-001**: Address Declaration
5. **LM-DATE-001**: Date Declaration
6. **LM-CARE-001**: Consumer Care Information
7. **LM-COO-001**: Country of Origin
8. **LM-PROD-001**: Product Name
9. **LM-OCR-001**: Text Readability

Rules can be managed via Admin dashboard.

## OCR Configuration

### Auto Mode (Default)
Automatically tries Tesseract, falls back to demo if unavailable.

```env
OCR_PROVIDER=auto
```

### Tesseract Mode
Requires Tesseract OCR installation.

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows
Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

```env
OCR_PROVIDER=tesseract
```

### Demo Mode
Uses pre-configured sample data for testing without OCR.

```env
OCR_PROVIDER=demo
```

## Compliance Score Calculation

```
Score = (Passed Rules / Total Rules) * 100

Status Assignment:
- PASS: No failed rules
- FAIL: Any failed rules exist
- REVIEW: Has review-needed rules, no failures
```

## Report Generation

PDF reports include:
- Inspection metadata
- Compliance score
- Declaration checklist
- Violations list
- Officer remarks
- Evidence with confidence scores
- Regulatory disclaimer

## Security

- **Password Hashing**: Bcrypt with Passlib
- **JWT Authentication**: HS256 tokens
- **Input Validation**: Pydantic schemas
- **File Validation**: Type and size checks
- **SQL Injection Protection**: SQLAlchemy ORM
- **CORS**: Configured for frontend access

## Error Handling

The application provides user-friendly error messages:

- **OCR Failures**: Fallback to demo data or manual input
- **Invalid Images**: Clear guidance on image requirements
- **Validation Errors**: Specific field-level messages
- **API Failures**: Automatic retry with timeout handling

## Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## Deployment

### Production Checklist
- [ ] Update `JWT_SECRET_KEY` in .env
- [ ] Set `DEBUG=False` in backend config
- [ ] Use PostgreSQL for production database
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS/SSL certificates
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Backup database regularly
- [ ] Use environment-specific secrets manager

### Docker Deployment
```bash
docker-compose up -d
```

## Future Enhancements

- Mobile application (iOS/Android)
- Cloud-based OCR integration
- Advanced computer vision features
- Font size measurement verification
- E-commerce listing analysis
- Multilingual OCR support
- Geographic inspection analytics
- Offline inspection mode
- Integration with GoI databases
- Advanced reporting and forecasting

## Known Limitations

- OCR accuracy depends on image quality
- Tesseract requires installation for production use
- SQLite recommended only for development
- File size limited to 10MB per image
- No multi-language support yet
- Async operations limited in current version

## Project Structure

```
metrology-ai/
├── backend/
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── config.py           # Configuration
│   ├── database.py         # Database setup
│   ├── main.py             # FastAPI app
│   ├── seed.py             # Initial data
│   ├── routes/
│   │   ├── auth.py         # Authentication
│   │   ├── products.py     # Product management
│   │   ├── inspections.py  # Inspection workflow
│   │   ├── analysis.py     # OCR/Validation
│   │   ├── rules.py        # Rule management
│   │   ├── dashboard.py    # Analytics
│   │   └── reports.py      # PDF generation
│   ├── services/
│   │   ├── auth_service.py        # JWT/Hashing
│   │   ├── ocr_service.py         # OCR Provider
│   │   ├── extraction_service.py  # Declaration extraction
│   │   ├── rule_engine.py         # Compliance rules
│   │   └── report_service.py      # PDF generation
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment template
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── main.jsx        # Entry point
│   │   ├── App.jsx         # Root component
│   │   ├── index.css       # Global styles
│   │   ├── services/
│   │   │   └── api.js      # API client
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InspectionsPage.jsx
│   │   │   ├── NewInspectionPage.jsx
│   │   │   ├── InspectionDetailPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── RulesPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   └── ...
│   ├── package.json        # Dependencies
│   ├── vite.config.js      # Vite config
│   ├── tailwind.config.js  # Tailwind config
│   ├── .gitignore
│   └── index.html
├── README.md
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is developed for Smart India Hackathon. Refer to LICENSE file for terms.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@metrology.ai
- Documentation: See `/docs` folder

## Disclaimer

**IMPORTANT**: This application is an AI-assisted preliminary screening tool. Final legal determination regarding product compliance rests with authorized Legal Metrology authorities. The automated assessment is indicative only and requires official officer verification.

The system does not make legally binding decisions and is designed to assist officers in preliminary inspection only.

---

**Version**: 1.0.0  
**Last Updated**: September 2024  
**Developed for**: Smart India Hackathon
