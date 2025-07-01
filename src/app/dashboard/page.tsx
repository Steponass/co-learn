import { getUserWithRole } from '@/utils/supabase/getUserWithRole'
import ClientDashboard from './ClientDashboard'

export default async function DashboardPage() {
  const { user, role } = await getUserWithRole()

  if (!user) return <p>Please log in.</p>

  return (
    <ClientDashboard userEmail={user.email ?? ''} role={role} />
  )
}