# 🚀 Invoice Management Tool Setup Guide

This guide will help you set up the Invoice Management Tool and resolve any configuration issues.

## ⚠️ Common Issue: "client_id query parameter is missing"

If you're seeing this error, it means your environment variables are not properly configured. Follow this guide to fix it.

## 📋 Prerequisites

1. **Node.js 18+** installed on your system
2. **QuickBooks Developer Account** (free)
3. **OpenAI API Key** (for AI features)

## 🔧 Step-by-Step Setup

### 1. Create QuickBooks Developer Account

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com/)
2. Sign up for a free developer account
3. Create a new app:
   - Choose "QuickBooks Online Accounting API"
   - Select "Production" or "Sandbox" (recommend Sandbox for testing)
   - App name: "Invoice Management Tool"

### 2. Get QuickBooks API Credentials

After creating your app:
1. Go to your app's dashboard
2. Navigate to "Keys & OAuth"
3. Copy your:
   - **Client ID** (also called App ID)
   - **Client Secret**

### 3. Configure Redirect URI

In your QuickBooks app settings:
1. Go to "Keys & OAuth" section
2. Add redirect URI: `http://localhost:3000/api/auth/quickbooks/callback`
3. If using port 3001: `http://localhost:3001/api/auth/quickbooks/callback`
4. Save the settings

### 4. Get OpenAI API Key

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account if you don't have one
3. Generate a new API key
4. Copy the key (starts with `sk-`)

### 5. Create Environment File

In your project root directory (same folder as `package.json`):

1. **Create** a file named `.env.local`
2. **Add** the following content:

```env
# QuickBooks Configuration
QUICKBOOKS_CLIENT_ID=ABRZKV0y73YEqiuQNZYwZm7ycQspsMJwlO8TWwD3XDj8D3zqhY
QUICKBOOKS_CLIENT_SECRET=MS1VHy2IWJWwYvCCoVHoHLgaCbD5ghCktrL9xcTn
QUICKBOOKS_SANDBOX_BASE_URL=https://sandbox-quickbooks.api.intuit.com
QUICKBOOKS_DISCOVERY_DOCUMENT=https://developer.intuit.com/.well-known/connect_from_oauth2

# OpenAI Configuration
OPENAI_API_KEY=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

# App Configuration
NEXTAUTH_SECRET=your_random_secret_string_here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### 6. Replace Placeholder Values

Replace these placeholders with your actual values:

- `your_random_secret_string_here` → Any random string (e.g., `my-super-secret-key-12345`)

**Example:**
```env
QUICKBOOKS_CLIENT_ID=ABCdef123456789
QUICKBOOKS_CLIENT_SECRET=XYZabc987654321
OPENAI_API_KEY=sk-1234567890abcdef...
NEXTAUTH_SECRET=my-invoice-app-secret-2024
NEXTAUTH_URL=http://localhost:3000
```

### 7. Update Port if Needed

If your app runs on port 3001 instead of 3000:
- Change `NEXTAUTH_URL=http://localhost:3001`
- Update QuickBooks redirect URI to match

## 🔄 Restart the Application

After creating `.env.local`:

1. **Stop** the development server (Ctrl+C)
2. **Restart** it:
   ```bash
   npm run dev
   ```
3. **Visit** the application (usually http://localhost:3000 or 3001)

## ✅ Verification

1. Visit your app in the browser
2. Click "Connect QuickBooks Online"
3. You should be redirected to QuickBooks login (not an error page)
4. After login, you'll be redirected back to your app

## 🐛 Troubleshooting

### Error: "client_id query parameter is missing"
- ✅ Check that `.env.local` exists in the project root
- ✅ Verify `QUICKBOOKS_CLIENT_ID` is set correctly
- ✅ Restart the development server after creating `.env.local`

### Error: "QUICKBOOKS_CLIENT_ID environment variable is not set"
- ✅ File name must be exactly `.env.local` (with the dot)
- ✅ File must be in the same directory as `package.json`
- ✅ No spaces around the `=` sign in the file

### Error: "Invalid redirect URI"
- ✅ Check that redirect URI in QuickBooks matches your `NEXTAUTH_URL`
- ✅ Include the full path: `/api/auth/quickbooks/callback`

### Error: "Unauthorized client"
- ✅ Verify your Client ID and Secret are correct
- ✅ Check if your QuickBooks app is published/enabled

## 📁 File Structure Check

Your project should look like this:
```
InvoiceManagement/
├── .env.local          ← Create this file
├── package.json
├── app/
├── components/
├── lib/
└── README.md
```

## 🔒 Security Notes

- **Never commit** `.env.local` to version control
- **Keep your API keys secret**
- **Use different keys** for development and production

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Check the terminal/server logs
3. Verify all environment variables are spelled correctly
4. Ensure there are no extra spaces or quotes around values

## 🎯 Next Steps

Once connected:
1. Try asking the AI: "Show me all invoices"
2. Create a test invoice: "Create an invoice for Test Customer"
3. Get analytics: "What's my revenue this month?"

Happy invoice managing! 🧾✨ 