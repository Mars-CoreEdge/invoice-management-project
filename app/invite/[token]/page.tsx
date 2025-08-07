'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvitationData {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'accountant' | 'viewer';
  team_name: string;
  invited_by: string;
  expires_at: string;
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchInvitation();
  }, []);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/teams/invitations/${params.token}`);
      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
      } else {
        setError('Invalid or expired invitation');
      }
    } catch (error) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    setAccepting(true);
    try {
      const response = await fetch('/api/teams/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_token: params.token })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Invitation Error</h1>
            <p className="text-purple-200 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Welcome to the Team!</h1>
            <p className="text-purple-200 mb-6">
              You've successfully joined {invitation?.team_name}. Redirecting to dashboard...
            </p>
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">👥</span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Team Invitation</h1>
          <p className="text-purple-200 mb-6">You've been invited to join a team</p>

          <div className="bg-white/5 rounded-xl p-6 mb-6 text-left">
            <div className="space-y-3">
              <div>
                <label className="text-purple-300 text-sm font-medium">Team Name</label>
                <p className="text-white font-semibold">{invitation.team_name}</p>
              </div>
              <div>
                <label className="text-purple-300 text-sm font-medium">Your Role</label>
                <p className="text-white font-semibold capitalize">{invitation.role}</p>
              </div>
              <div>
                <label className="text-purple-300 text-sm font-medium">Invited By</label>
                <p className="text-white">{invitation.invited_by}</p>
              </div>
              <div>
                <label className="text-purple-300 text-sm font-medium">Expires</label>
                <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {isExpired ? (
            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-300 mb-4">This invitation has expired</p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={acceptInvitation}
                disabled={accepting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full border-purple-400 text-purple-300 hover:bg-purple-400/10"
              >
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 