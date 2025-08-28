# Logo Setup Instructions

## Replacing the Placeholder Logo

Your app is now configured to use your custom ODPADNIK logo! Here's how to replace the placeholder with your actual logo:

### 1. Logo File Setup

Your logo is currently set up as `frontend/public/odpadnik.png`. The app is configured to use this PNG file in both the sidebar and login page.

### 2. Update File References (if needed)

If you use a different file format or name, update these files:

#### In `frontend/src/components/AppSidebar.jsx`:
```jsx
<img 
  src="/odpadnik.png"  // Currently configured
  alt="ODPADNIK Logo" 
  className="w-8 h-8 object-contain"
/>
```

#### In `frontend/src/pages/Login.jsx`:
```jsx
<img 
  src="/odpadnik.png"  // Currently configured
  alt="ODPADNIK Logo" 
  className="w-16 h-16 object-contain"
/>
```

### 3. Logo Specifications

For best results, your logo should be:
- **Minimum size**: 200x60 pixels
- **Format**: SVG (preferred) or PNG with transparency
- **Background**: Transparent or dark background to match the sidebar theme
- **Colors**: Should work well on dark backgrounds (sidebar) and light backgrounds (login page)

### 4. Current Implementation

The logo is currently used in:
- ✅ **Sidebar**: Top-left corner of the main navigation
- ✅ **Login Page**: Centered above the login form
- ✅ **Favicon**: Browser tab icon (truck-themed)
- ✅ **Page Title**: "ODPADNIK - Waste Management System"

### 5. Fallback System

The app includes a fallback system that will show the original trash bin icon if your logo fails to load, ensuring the app always looks good.

### 6. Testing

After replacing the logo:
1. Start your development server: `npm start`
2. Check the sidebar logo
3. Check the login page logo
4. Verify the favicon in your browser tab

Your logo should now be fully integrated into your ODPADNIK waste management application!
