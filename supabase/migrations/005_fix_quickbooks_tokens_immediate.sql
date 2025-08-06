-- Immediate fix for quickbooks_tokens table
-- This migration fixes the foreign key constraint issue by referencing auth.users directly

-- Drop existing quickbooks_tokens table if it exists
DROP TABLE IF EXISTS public.quickbooks_tokens CASCADE;

-- Create the quickbooks_tokens table with proper foreign key to auth.users
CREATE TABLE IF NOT EXISTS public.quickbooks_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  realm_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one token record per user with named constraint
  CONSTRAINT quickbooks_tokens_user_id_unique UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_user_id ON public.quickbooks_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_realm_id ON public.quickbooks_tokens(realm_id);
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_expires_at ON public.quickbooks_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_created_at ON public.quickbooks_tokens(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.quickbooks_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to only see/modify their own tokens
DROP POLICY IF EXISTS "quickbooks_tokens_access_policy" ON public.quickbooks_tokens;
CREATE POLICY "quickbooks_tokens_access_policy" ON public.quickbooks_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to update quickbooks_tokens updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_quickbooks_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update quickbooks_tokens updated_at timestamp
DROP TRIGGER IF EXISTS on_quickbooks_tokens_updated ON public.quickbooks_tokens;
CREATE TRIGGER on_quickbooks_tokens_updated
  BEFORE UPDATE ON public.quickbooks_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_quickbooks_tokens_updated_at();

-- Function to get user's QuickBooks connection status
CREATE OR REPLACE FUNCTION public.get_user_quickbooks_status(user_uuid UUID)
RETURNS TABLE(
  is_connected BOOLEAN,
  realm_id TEXT,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qt.user_id IS NOT NULL as is_connected,
    qt.realm_id,
    qt.expires_at,
    qt.expires_at < NOW() as is_expired
  FROM auth.users u
  LEFT JOIN public.quickbooks_tokens qt ON u.id = qt.user_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.quickbooks_tokens 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.quickbooks_tokens IS 'Encrypted QuickBooks OAuth tokens for each user';
COMMENT ON FUNCTION public.get_user_quickbooks_status IS 'Get QuickBooks connection status for a user';
COMMENT ON FUNCTION public.cleanup_expired_tokens IS 'Remove expired QuickBooks tokens from the database'; 