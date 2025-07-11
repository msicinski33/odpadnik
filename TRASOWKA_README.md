image.png# 🗑️ Trasówka Module - ODPADnik

## Overview
The Trasówka module is a comprehensive route sheet generator for waste collection operations. It allows users to create printable PDF documents that show collection routes organized by regions, with assigned waste fractions and collection dates.

## Features

### 🎯 Core Functionality
1. **Region Selection** - Choose from available regions in the system
2. **Automatic Point Loading** - System loads all residential points assigned to the selected region
3. **Fraction Assignment** - Assign multiple waste fractions (PAP, BIO, TW, SZ, ZM) with specific dates
4. **PDF Generation** - Generate professional PDF documents for printing

### 📄 PDF Output Requirements
- **Format**: A4 landscape orientation
- **Header**: 
  - "Nieruchomości zamieszkałe R-X" (where R-X is the selected region)
  - "Miasto Słupsk, 2025 r."
  - Pagination: "Strona X z Y stron"
- **Table Structure**:
  - Lp. (index column)
  - ADRES (address column)
  - One column per fraction with date and fraction code
- **Color Coding**:
  - PAP = Blue (#3C8DBC)
  - BIO = Red (#C0392B)
  - TW = Yellow (#F1C40F)
  - SZ = Green (#27AE60)
  - ZM = Dark Gray (#2C3E50)

### 🎨 User Interface
- **Modern Design** - Clean, responsive interface using Tailwind CSS
- **Modal Interface** - Easy fraction and date assignment through modal popup
- **Real-time Preview** - See assigned fractions before generating PDF
- **Download Functionality** - Direct PDF download after generation

## Technical Implementation

### Frontend Components
- `Trasowka.jsx` - Main page component
- `TrasowkaModal.jsx` - Modal for fraction assignment
- React Query for data fetching
- PDFKit for PDF generation

### Backend Routes
- `POST /api/trasowka/generate` - Generate PDF with route data
- Integrates with existing regions, points, and fractions APIs

### Dependencies
- **Frontend**: React, Tailwind CSS, Lucide React icons
- **Backend**: Express, PDFKit, Prisma ORM
- **Database**: SQLite (development)

## Usage Instructions

### 1. Access the Module
- Navigate to "Trasówka" in the main sidebar
- The module is available to authenticated users

### 2. Select a Region
- Choose from the available regions displayed as cards
- System will automatically load all residential points for that region

### 3. Assign Fractions
- Click "Przypisz frakcje" button
- In the modal, add fractions and assign dates (DD-MM format)
- Each fraction can have a different collection date
- Preview colors for each fraction type

### 4. Generate PDF
- Click "Generuj PDF" to create the document
- System will generate a multi-page PDF if needed (25 rows per page)
- Download the PDF using the "Pobierz PDF" button

### 5. Print and Use
- The generated PDF is ready for printing
- Empty cells in fraction columns are for manual handwriting
- Each page includes proper headers and pagination

## Sample Data
The system includes sample data for testing:
- **Fractions**: PAP, BIO, TW, SZ, ZM with appropriate colors
- **Regions**: R-1, R-2, R-3
- **Points**: Sample residential addresses in Słupsk

## File Structure
```
frontend/src/
├── pages/
│   └── Trasowka.jsx          # Main Trasówka page
└── components/
    └── TrasowkaModal.jsx     # Fraction assignment modal

backend/
├── routes/
│   └── trasowka.js           # PDF generation API
├── seed-fractions.js         # Sample fractions data
└── seed-test-data.js         # Sample regions and points
```

## Future Enhancements
- [ ] Export preview before download
- [ ] Custom page break settings
- [ ] Multiple region selection
- [ ] Template customization
- [ ] Batch PDF generation
- [ ] Integration with shift planning

## Troubleshooting
- Ensure all dependencies are installed (`npm install` in both frontend and backend)
- Check that sample data is seeded (`node seed-fractions.js` and `node seed-test-data.js`)
- Verify PDFKit is properly installed in backend
- Check browser console for any JavaScript errors
- Ensure backend server is running on port 3000

## Support
For issues or questions about the Trasówka module, check the application logs or contact the development team. 