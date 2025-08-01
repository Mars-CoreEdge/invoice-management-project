# OAuth Setup Guide for GitHub and Google

This guide will help you set up GitHub and Google OAuth providers with Supabase for your Invoice Management Tool.

## 🚀 Quick Start

### 1. GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name:** `Invoice Management Tool`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/callback`
4. Click "Register application"
5. **Copy the Client ID and Client Secret**

#### Step 2: Configure in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **GitHub** and click **Enable**
5. Enter your GitHub credentials:
   - **Client ID:** Your GitHub Client ID
   - **Client Secret:** Your GitHub Client Secret
6. Set **Redirect URL** to: `http://localhost:3000/auth/callback`
7. Click **Save**

### 2. Google OAuth Setup

#### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Fill in the details:
   - **Name:** `Invoice Management Tool`
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/auth/callback`
7. Click **Create**
8. **Copy the Client ID and Client Secret**

#### Step 2: Configure in Supabase
1. In your Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Enter your Google credentials:
   - **Client ID:** Your Google Client ID
   - **Client Secret:** Your Google Client Secret
4. Set **Redirect URL** to: `http://localhost:3000/auth/callback`
5. Click **Save**

## 🔧 Environment Variables

Add these to your `.env.local` file:

```bash
# OAuth Providers (Optional - for additional sign-in methods)
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🎨 Features Added

### OAuth Buttons
- **GitHub Sign-in:** Beautiful glassmorphism button with GitHub icon
- **Google Sign-in:** Matching design with Chrome icon
- **Responsive Design:** Works on all screen sizes
- **Hover Effects:** Smooth animations and transitions
- **Consistent Theme:** Matches your purple gradient design

### User Experience
- **Multiple Sign-in Options:** Email/password, GitHub, and Google
- **Seamless Redirects:** Automatic redirection after OAuth authentication
- **Error Handling:** Graceful error handling for failed OAuth attempts
- **Loading States:** Visual feedback during authentication

## 🧪 Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit the login page:**
   ```
   http://localhost:3000/auth/login
   ```

3. **Test OAuth flows:**
   - Click "Continue with GitHub" → Should redirect to GitHub
   - Click "Continue with Google" → Should redirect to Google
   - After authorization → Should redirect back to dashboard

## 🔒 Security Notes

- **Never commit OAuth secrets** to version control
- **Use environment variables** for all sensitive data
- **Set up proper redirect URLs** in both OAuth providers and Supabase
- **Test in production** with your actual domain URLs

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error:**
   - Ensure redirect URLs match exactly in both OAuth provider and Supabase
   - Check for trailing slashes or protocol mismatches

2. **"Client ID not found" error:**
   - Verify your Client ID is correct
   - Ensure the OAuth app is properly configured

3. **"Callback URL mismatch" error:**
   - Update both GitHub/Google and Supabase with the same callback URL
   - Use `http://localhost:3000/auth/callback` for development

4. **OAuth buttons not appearing:**
   - Check that OAuth providers are enabled in Supabase
   - Verify the `OAuthButtons` component is imported correctly

### Production Deployment:

When deploying to production, update:
1. **OAuth App URLs** to your production domain
2. **Supabase redirect URLs** to your production domain
3. **Environment variables** with production credentials

## 📱 Mobile Support

The OAuth buttons are fully responsive and work on:
- Desktop browsers
- Mobile browsers
- Tablet devices
- All screen sizes

## 🎯 Next Steps

After setting up OAuth:
1. Test all authentication flows
2. Customize user profiles after OAuth sign-in
3. Add additional OAuth providers if needed
4. Implement user role management
5. Add social login analytics

---

**Need help?** Check the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) for more details. 