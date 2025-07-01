import { getUserWithRole } from '@/utils/supabase/getUserWithRole'
import { redirect } from 'next/navigation'

export default async function HostPage() {
  const { user, role } = await getUserWithRole()

  if (!user || (role !== 'facilitator')) {
    redirect('/unauthorized')
  }

  return (
    <div>
      <h1>Host a Session</h1>
      <p>You a GOD.</p>
    </div>
  )
}
