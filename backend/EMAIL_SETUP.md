# Email Configuration Setup

To enable email notifications for vehicle fault reports, you need to configure the following environment variables in your `.env` file:

## Required Environment Variables

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FLEET_EMAIL=fleet@yourcompany.com
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS`

## Alternative Email Services

You can modify the email configuration in `routes/vehicles.js` to use other services:

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'outlook',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Custom SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Testing Email Configuration

You can test the email configuration by reporting a vehicle fault through the UI. The system will attempt to send an email notification to the address specified in `FLEET_EMAIL`.

## Troubleshooting

- **Authentication failed**: Check your email credentials and app password
- **Connection timeout**: Verify your internet connection and email provider settings
- **Email not received**: Check spam folder and verify the recipient email address 