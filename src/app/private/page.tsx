import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <main>
      <h1>Hello, Clarise.</h1>
      <p>Just kidding, hey {data.user.email}</p>
    </main>
  )
}