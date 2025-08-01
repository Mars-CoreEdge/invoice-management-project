# Supabase Authentication Setup

This guide will help you set up Supabase authentication for your Invoice Management Tool.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `invoice-management-tool`
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Existing configurations
OPENAI_API_KEY=your_openai_api_key
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/auth/quickbooks/callback
```

## 4. Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

## 5. Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## 6. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should be redirected to `/auth/login`
4. Try creating a new account
5. Check your email for confirmation
6. Sign in and access the dashboard

## 7. Production Deployment

When deploying to production:

1. Update your Supabase project settings:
   - **Site URL**: Your production domain
   - **Redirect URLs**: Add your production callback URLs

2. Update your environment variables with production values

3. Ensure your domain is properly configured in your hosting platform

## Features Included

- ✅ Email/password authentication
- ✅ Email confirmation
- ✅ Protected routes with middleware
- ✅ User context provider
- ✅ Login/Signup pages
- ✅ Logout functionality
- ✅ Session management
- ✅ Automatic redirects

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your environment variables are correctly set
   - Restart your development server after changing `.env.local`

2. **Redirect loop**
   - Verify your redirect URLs in Supabase settings
   - Check that your middleware is working correctly

3. **Email not received**
   - Check spam folder
   - Verify email templates in Supabase dashboard
   - Check Supabase logs for email delivery issues

4. **Session not persisting**
   - Ensure cookies are enabled
   - Check that your domain matches the Site URL in Supabase

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Next.js with Supabase guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- Check the Supabase logs in your dashboard for detailed error messages 