-- Create the quickbooks_tokens table for secure token storage
CREATE TABLE IF NOT EXISTS quickbooks_tokens (
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_user_id ON quickbooks_tokens(user_id);

-- Create index for expired token cleanup
CREATE INDEX IF NOT EXISTS idx_quickbooks_tokens_expires_at ON quickbooks_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE quickbooks_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure users can only access their own tokens
CREATE POLICY "Users can only access their own QuickBooks tokens" ON quickbooks_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_quickbooks_tokens_updated_at
  BEFORE UPDATE ON quickbooks_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 