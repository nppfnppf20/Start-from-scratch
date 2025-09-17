# Project Data Filler - Office Add-in

This Office add-in allows you to populate Word documents with project data from your database.

## 🚀 What We've Built

- **API Key Authentication**: Uses shared API key for simple team access
- **Project Selection**: Dropdown to choose from your projects
- **Template System**: Three predefined templates:
  - Project Summary (basic project info)
  - Surveyor Brief (detailed site and access info)
  - Technical Specification (technical project details)
- **Word Integration**: Automatically populates Word documents with formatted data

## 📁 File Structure

```
office-addon/
├── manifest.xml          # Office add-in configuration
├── src/
│   ├── taskpane.html     # Main UI
│   ├── taskpane.css      # Styles
│   ├── taskpane.js       # Main application logic
│   ├── api.js            # API communication
│   └── templates.js      # Document population templates
├── assets/               # Icons (need to be added)
└── README.md            # This file
```

## 🔧 Setup Instructions

### 1. Backend Configuration
✅ **Already completed!** The backend now supports:
- API key authentication (`office-addon-key-2025`)
- Static file serving for the add-in
- Flexible authentication (API key OR Auth0)

### 2. Start Your Backend
Make sure your backend is running:
```bash
cd "start from scratch backend"
npm start  # Should run on http://localhost:5000
```

### 3. Create Icon Files (Optional)
Add these icon files to `/office-addon/assets/`:
- `icon-16.png` (16x16px)
- `icon-32.png` (32x32px) 
- `icon-64.png` (64x64px)
- `icon-80.png` (80x80px)

Or download placeholder icons online and rename them.

### 4. Update URLs for Production
In `manifest.xml` and `api.js`, update:
- `https://localhost:5000` → your production domain
- Keep `localhost:5000` for development

## 📦 Installing the Add-in

### For Development/Testing:
1. Open Word (desktop version)
2. Go to **Insert** → **Add-ins** → **My Add-ins**
3. Click **Upload My Add-in**
4. Select `manifest.xml` from this directory
5. The add-in will appear in Word's ribbon

### For Team Distribution:
1. Host the entire `office-addon` folder on your web server
2. Update all URLs in `manifest.xml` to point to your server
3. Share the `manifest.xml` file with your team
4. Each person installs it following the steps above

## 🎯 How to Use

1. **Open Word** and create a new document
2. **Open the add-in** from the ribbon/task pane
3. **Select a project** from the dropdown
4. **Choose a template** (Project Summary, Surveyor Brief, or Technical Spec)
5. **Click "Fill Document"** to populate the Word document

## 🛡️ Security

- Uses shared API key: `office-addon-key-2025`
- Read-only access to projects and quotes
- No individual authentication required
- Easy to revoke access by changing the API key

## 🔄 Making Changes

### To add new templates:
1. Edit `templates.js` - add new template functions
2. Update `taskpane.html` - add option to template dropdown
3. Templates use Office.js Word API for document manipulation

### To modify the UI:
1. Edit `taskpane.html` for structure
2. Edit `taskpane.css` for styling
3. Edit `taskpane.js` for behavior

### To change API endpoints:
1. Edit `api.js` - update the `ProjectAPI` class

## 🐛 Troubleshooting

**Add-in won't load:**
- Check that backend is running on localhost:5000
- Verify manifest.xml URLs are correct
- Check browser console for JavaScript errors

**API connection fails:**
- Confirm backend has API key middleware enabled
- Check that CORS allows your add-in domain
- Verify API key matches between add-in and backend

**Templates don't work:**
- Ensure Office.js is loaded properly
- Check Word version supports the APIs used
- Look at browser console for Office.js errors

## 🎉 Next Steps

Your Office add-in is ready to use! The team can now:
1. Install the add-in in Word
2. Select projects from your database
3. Automatically populate Word documents with project data
4. Save time on document creation

**Happy document filling!** 📄✨
