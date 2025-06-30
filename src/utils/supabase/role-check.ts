export function isAllowed(userRole: string | undefined, path: string): boolean {
  if (!userRole) return false

  if (path.startsWith('/admin')) return userRole === 'admin'
  if (path.startsWith('/host')) return userRole === 'facilitator'
  if (path.startsWith('/participant')) return userRole === 'participant'

  // Default: allow access to other routes
  return true
}
