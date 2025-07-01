import { createClient } from './server'

export async function getUserWithRole() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user?.user_metadata?.user_role || null

  return { user, role }
}
