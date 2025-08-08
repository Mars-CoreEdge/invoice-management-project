'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, ArrowLeft } from 'lucide-react'

export default function CreateTeamPage() {
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_name: teamName.trim(),
          description: description.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/teams/${result.data.team_id}`)
      } else {
        setError(result.error || 'Failed to create team')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Team</h1>
          <p className="text-purple-200">
            Create a new team to collaborate with your colleagues on invoice management.
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

            {/* Team Name */}
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-white mb-2">
                Team Name *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this team is for..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !teamName.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Team...' : 'Create Team'}
              </Button>
              <Link href="/teams">
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
            <li>• You'll be automatically added as the team admin</li>
            <li>• You can invite team members with different roles</li>
            <li>• Team members can collaborate on invoices and use AI tools</li>
            <li>• You can manage team settings and permissions</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
