import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function logAudit(entry: {
  userId: string
  teamId: string
  action: 'create' | 'update' | 'delete' | 'list'
  target: 'invoice'
  targetId?: string
  payload?: any
}) {
  try {
    const supabase = createServerSupabaseClient()
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      team_id: entry.teamId,
      action: `${entry.target}:${entry.action}`,
      target_id: entry.targetId || null,
      payload: entry.payload ? JSON.stringify(entry.payload).slice(0, 8000) : null
    })
  } catch (e) {
    console.warn('Audit log failed:', e)
  }
}


