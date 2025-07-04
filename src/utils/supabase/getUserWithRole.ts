import { createClient } from './server'

export async function getUserWithRole() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[getUserWithRole] No user found', userError)
    return { user: null, role: null, name: null }
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role, name')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[getUserWithRole] Failed to fetch role:', error.message)
    return { user, role: null, name: null }
  }

  const role = data?.role as 'admin' | 'facilitator' | 'participant' | null
  const name = data?.name ?? null

  return { user, role, name }
}