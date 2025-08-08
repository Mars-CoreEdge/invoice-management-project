'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, ArrowLeft, Shield, Settings, Eye } from 'lucide-react'
import { TeamRole } from '@/types/teams'

export default function InviteMemberPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    {
      value: 'admin' as TeamRole,
      label: 'Admin',
      description: 'Full access to manage team, members, and all features',
      icon: Shield,
      color: 'text-purple-400'
    },
    {
      value: 'accountant' as TeamRole,
      label: 'Accountant',
      description: 'Can create, edit invoices and use AI tools',
      icon: Settings,
      color: 'text-blue-400'
    },
    {
      value: 'viewer' as TeamRole,
      label: 'Viewer',
      description: 'Read-only access to view invoices and reports',
      icon: Eye,
      color: 'text-gray-400'
    }
  ]

  if (success) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Invitation Sent!</h1>
            <p className="text-purple-200 mb-8">
              We've sent an invitation to <span className="text-white font-medium">{email}</span> to join your team as a <span className="text-white font-medium">{role}</span>.
            </p>
            <div className="space-y-3">
              <Link href={`/teams/${teamId}`}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
                  Back to Team
                </Button>
              </Link>
              <div>
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                    setRole('viewer')
                  }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-3 px-6 rounded-xl"
                >
                  Invite Another Member
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/teams/${teamId}`}
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Team
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Invite Team Member</h1>
          <p className="text-purple-200">
            Invite a colleague to join your team and collaborate on invoice management.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
                <div className="text-red-100 text-sm">{error}</div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-4">
                Team Role *
              </label>
              <div className="space-y-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        role === option.value
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={role === option.value}
                        onChange={(e) => setRole(e.target.value as TeamRole)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        role === option.value
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-white/30'
                      }`}>
                        {role === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${option.color}`} />
                          <span className="text-white font-medium">{option.label}</span>
                        </div>
                        <p className="text-purple-200 text-sm">{option.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
              <Link href={`/teams/${teamId}`}>
                <Button
                  type="button"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-3 px-6 rounded-xl"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4">
          <h3 className="text-blue-200 font-medium mb-2">What happens next?</h3>
          <ul className="text-blue-100 text-sm space-y-1">
            <li>• An invitation email will be sent to the provided address</li>
            <li>• The recipient can accept the invitation by clicking the link in the email</li>
            <li>• Once accepted, they'll be added to your team with the selected role</li>
            <li>• You can manage their permissions from the team settings</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
