# MetrologyAI - Quick Start Guide

Get MetrologyAI up and running in 5 minutes!

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Terminal/Command Prompt

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd metrology-ai/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional, uses defaults)
cp .env.example .env

# Start backend server
python -m uvicorn main:app --reload --port 8000
```

✅ Backend running at: http://localhost:8000

## Step 2: Frontend Setup (2 minutes)

In a **new terminal**:

```bash
# Navigate to frontend
cd metrology-ai/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at: http://localhost:5173

## Step 3: Access Application

1. Open browser: **http://localhost:5173**
2. Login with demo credentials:
   - **Admin**: admin@metrology.ai / admin123
   - **Inspector**: inspector@metrology.ai / inspector123

## Step 4: Try Demo Scan

1. Click "New Inspection"
2. Click "Try Demo Scan" button
3. Watch the automated analysis
4. View compliance results

## Complete Workflow

```
Login → Dashboard → New Inspection → 
  Select Category → Select Product → 
  Upload Images → Start Scan → 
  Review Results → Download PDF → 
  View History
```

## Common Commands

### Backend
```bash
# Run server
python -m uvicorn main:app --reload --port 8000

# Stop server
Ctrl+C

# Access API docs
http://localhost:8000/docs
```

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## Demo Features

### Dashboard
- 📊 Compliance analytics
- 📈 Trend visualization
- 🔴 Violation statistics
- ⏰ Recent inspections

### Inspection Workflow
1. Product category selection
2. Product repository search
3. Drag-drop image upload
4. AI-powered OCR scanning
5. Automated rule validation
6. Compliance scoring
7. Evidence highlighting
8. PDF report generation

### Sample Data
The application includes:
- 5 pre-loaded products
- 8 sample inspections
- 9 compliance rules
- Demo violations

## System Requirements

### Backend
- Python 3.8+
- RAM: 1GB minimum
- Storage: 100MB
- Database: SQLite (included)

### Frontend
- Modern browser (Chrome, Firefox, Safari, Edge)
- RAM: 512MB minimum
- Internet: For loading images

## Troubleshooting

### Backend won't start
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check port 8000 is available
netstat -an | grep 8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### Frontend won't start
```bash
# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### OCR not working
- Demo mode activated automatically
- Install Tesseract for production:
  - Ubuntu: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`
  - Windows: Download from GitHub

### Database issues
```bash
# Reset database
rm metrology.db  # or your database file
python -m main  # Creates fresh database
```

### Port conflicts
Change port in configuration:
```bash
# Backend (use port 8001)
python -m uvicorn main:app --reload --port 8001

# Frontend (use port 5174)
npm run dev -- --port 5174
```

## Next Steps

1. **Read Documentation**: See README.md for full details
2. **Explore APIs**: Visit http://localhost:8000/docs
3. **Create Inspections**: Upload real product images
4. **Manage Rules**: Customize compliance rules
5. **View Analytics**: Check dashboard trends

## Need Help?

### Check Logs
- Backend logs: Terminal running uvicorn
- Frontend logs: Browser console (F12)
- Backend API: http://localhost:8000/docs

### Common Issues
- **503 Error**: Backend not running
- **CORS Error**: Check API_BASE_URL in frontend/src/services/api.js
- **Login Failed**: Check demo credentials
- **Images Not Processing**: Use JPG/PNG under 10MB

## Demo Workflow

### Inspector Inspection
1. Login: inspector@metrology.ai / inspector123
2. Dashboard: View statistics
3. Click "New Inspection"
4. Choose "Food" category
5. Select a product from list
6. Upload or try demo scan
7. View results
8. Download PDF report

### Admin Management
1. Login: admin@metrology.ai / admin123
2. Dashboard: Full system view
3. Manage rules: Enable/disable/edit
4. View all inspections
5. System analytics
6. Settings

## Performance Tips

- Keep images under 5MB for faster processing
- Use JPEG format for best performance
- Close unnecessary browser tabs
- Restart backend if memory increases
- Use demo mode for initial testing

## File Structure
```
metrology-ai/
├── backend/          # Python FastAPI app
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── models.py     # Database models
├── frontend/         # React app
│   ├── src/
│   │   ├── pages/    # React pages
│   │   ├── components/ # React components
│   │   └── services/ # API client
│   └── package.json  # Dependencies
└── README.md         # Full documentation
```

---

**Ready to inspect?** 🚀

Visit http://localhost:5173 and start using MetrologyAI!
