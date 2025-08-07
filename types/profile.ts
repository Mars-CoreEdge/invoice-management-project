export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  avatar_url?: string;
}

export interface ProfileSetupData {
  full_name: string;
  avatar_url?: string;
}
