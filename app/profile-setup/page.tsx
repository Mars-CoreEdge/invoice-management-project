'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Camera, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { ProfileSetupData } from '@/types/profile';

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileSetupData>({
    full_name: '',
    avatar_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          avatar_url: formData.avatar_url || null
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Profile Updated!</h1>
          <p className="text-purple-200 mb-6">
            Your profile has been successfully updated. Redirecting to dashboard...
          </p>
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 opacity-10 animate-bounce delay-500"></div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-white/20 relative overflow-hidden">
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
            
            {/* Main Icon */}
            <div className="relative z-10 mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse shadow-lg">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Complete Your Profile
              </h1>
              <p className="text-purple-200 text-base sm:text-lg flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Let's personalize your experience
                <Sparkles className="w-5 h-5" />
              </p>
            </div>
            
            <div className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Input */}
                <div className="text-left">
                  <label htmlFor="full_name" className="block text-sm font-medium text-purple-200 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Avatar URL Input */}
                <div className="text-left">
                  <label htmlFor="avatar_url" className="block text-sm font-medium text-purple-200 mb-2">
                    Profile Picture URL (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="avatar_url"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all pr-12"
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <Camera className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    Add a URL to your profile picture
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-red-200 mb-1">Error</div>
                        <div className="text-red-100 text-sm">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.full_name.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Updating Profile...
                    </>
                  ) : (
                    <>
                      <span className="mr-3">✨</span>
                      Complete Setup
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                {/* Skip for now */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="text-purple-300 hover:text-white text-sm transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </form>

              <p className="text-purple-300 text-xs sm:text-sm mt-6 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Your data is secure and encrypted
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
